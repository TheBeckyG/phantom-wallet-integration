const DEFAULT_PHANTOM_DEEP_LINK = 'https://phantom.app/ul/v1/connect';
const DEFAULT_CLUSTER = 'mainnet-beta';

class BaseWalletProvider {
  constructor(provider) {
    this.provider = provider;
  }

  async request(method, params = []) {
    if (!this.provider) {
      throw new Error('No wallet provider is available');
    }

    if (typeof this.provider.request === 'function') {
      return this.provider.request({ method, params });
    }

    throw new Error('Provider does not support request RPC calls');
  }

  normalizeMessage(message) {
    if (typeof message === 'string') {
      return new TextEncoder().encode(message);
    }

    if (message instanceof Uint8Array) {
      return message;
    }

    if (Array.isArray(message)) {
      return new Uint8Array(message);
    }

    throw new Error('Message must be a string, Uint8Array, or array of bytes');
  }
}

class SolanaWalletAdapter extends BaseWalletProvider {
  async connect() {
    try {
      const response = await this.request('connect');
      if (typeof this.provider.connect === 'function') {
        return this.provider.connect();
      }

      return response;
    } catch (error) {
      throw new Error('Failed to connect wallet provider');
    }
  }

  async requestAccount() {
    try {
      const response = await this.connect();

      if (Array.isArray(response)) {
        return response;
      }

      if (response?.publicKey) {
        return [response.publicKey.toString()];
      }

      if (response?.address) {
        return [response.address];
      }

      return [];
    } catch (error) {
      throw new Error('Failed to request wallet account');
    }
  }

  async disconnect() {
    try {
      const response = await this.request('disconnect');

      if (typeof this.provider.disconnect === 'function') {
        return this.provider.disconnect();
      }

      return response;
    } catch (error) {
      throw new Error('Failed to disconnect wallet provider');
    }
  }

  async signMessage(message, encoding = 'utf8') {
    try {
      const normalized = this.normalizeMessage(message);

      if (typeof this.provider.signMessage === 'function') {
        return this.provider.signMessage(normalized, encoding);
      }

      return this.request('signMessage', [normalized, { encoding }]);
    } catch (error) {
      throw new Error('Failed to sign message');
    }
  }

  async signTransaction(transaction) {
    try {
      if (typeof this.provider.signTransaction === 'function') {
        return this.provider.signTransaction(transaction);
      }

      return this.request('signTransaction', [transaction]);
    } catch (error) {
      throw new Error('Failed to sign transaction');
    }
  }

  async sendTransaction(transaction, connection, options = {}) {
    try {
      // Prefer provider's native sign-and-send if available (Phantom supports this)
      if (typeof this.provider.signAndSendTransaction === 'function') {
        const result = await this.provider.signAndSendTransaction(transaction, options);
        const signature = result?.signature || result;

        try {
          const latest = await connection.getLatestBlockhash();
          await connection.confirmTransaction({ signature, ...latest }, 'finalized');
        } catch (e) {
          // best-effort; ignore confirmation errors here
        }

        return signature;
      }

      // Fallback: sign locally then send raw transaction and confirm with latest blockhash
      const signedTransaction = await this.signTransaction(transaction);
      const rawTransaction = signedTransaction.serialize();
      const signature = await connection.sendRawTransaction(rawTransaction, options);

      try {
        const latest = await connection.getLatestBlockhash();
        await connection.confirmTransaction({ signature, ...latest }, 'finalized');
      } catch (e) {
        // best-effort; ignore confirmation errors here
      }

      return signature;
    } catch (error) {
      throw new Error('Failed to send transaction');
    }
  }
}

class Phantom {
  static get provider() {
    return window?.phantom?.solana || window?.phantom?.app || window?.solana || null;
  }

  static get wallet() {
    if (window?.phantom?.solana) {
      return this.injectProvider(window.phantom.solana);
    }

    if (window?.phantom?.app) {
      return window.phantom.app;
    }

    if (window?.solana) {
      return this.injectProvider(window.solana);
    }

    return null;
  }

  static injectProvider(provider = window?.solana) {
    if (!provider) {
      throw new Error('No wallet provider available to inject');
    }

    const adapter = new SolanaWalletAdapter(provider);
    window.phantom = window.phantom || {};
    window.phantom.app = adapter;
    return adapter;
  }

  static isInstalled() {
    return Boolean(window?.phantom?.solana || window?.phantom?.app || window?.solana);
  }

  static async requestAccount() {
    try {
      const wallet = this.wallet;

      if (!wallet) {
        throw new Error('Phantom wallet not detected');
      }

      return await wallet.requestAccount();
    } catch (error) {
      throw new Error('Failed to request wallet account');
    }
  }

  static async signMessage(message) {
    try {
      const wallet = this.wallet;

      if (!wallet) {
        throw new Error('Phantom wallet not detected');
      }

      return await wallet.signMessage(message);
    } catch (error) {
      throw new Error('Failed to sign message');
    }
  }

  static async signTransaction(transaction) {
    try {
      const wallet = this.wallet;

      if (!wallet) {
        throw new Error('Phantom wallet not detected');
      }

      return await wallet.signTransaction(transaction);
    } catch (error) {
      throw new Error('Failed to sign transaction');
    }
  }

  static async sendTransaction(transaction, connection, options = {}) {
    try {
      const wallet = this.wallet;

      if (!wallet) {
        throw new Error('Phantom wallet not detected');
      }

      return await wallet.sendTransaction(transaction, connection, options);
    } catch (error) {
      throw new Error('Failed to send transaction');
    }
  }

  static createDeepLinkUrl({
    appUrl = window.location.origin,
    redirectUrl = window.location.href,
    cluster = DEFAULT_CLUSTER,
    alwaysOpenInApp = false,
  } = {}) {
    const baseScheme = alwaysOpenInApp ? 'phantom://app/ul/browse/' : 'https://phantom.app/ul/browse/';
    const encoded = encodeURIComponent(redirectUrl);
    const params = new URLSearchParams({ app_url: appUrl, cluster });
    return `${baseScheme}${encoded}?${params.toString()}`;
  }

  static deepLinkOnboard(options = {}) {
    const url = this.createDeepLinkUrl(options);

    if (options.navigate !== false) {
      window.location.href = url;
    }

    return url;
  }

  static async injectScript(src, id) {
    if (!document || typeof document.createElement !== 'function') {
      throw new Error('Document environment is required to inject scripts');
    }

    if (id && document.getElementById(id)) {
      return document.getElementById(id);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      if (id) script.id = id;
      script.async = true;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  static injectWalletLibrary(name, src) {
    return this.injectScript(src, `wallet-lib-${name}`);
  }
}

// Export legacy short names for backwards compatibility
export { Phantom, BaseWalletProvider as Oh, SolanaWalletAdapter as Gu };
