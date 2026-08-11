const DEFAULT_PHANTOM_DEEP_LINK = 'https://phantom.app/ul/v1/connect';
const DEFAULT_CLUSTER = 'mainnet-beta';

class Oh {
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

class Gu extends Oh {
  async connect() {
    if (typeof this.provider.connect === 'function') {
      return this.provider.connect();
    }

    return this.request('connect');
  }

  async requestAccount() {
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
  }

  async disconnect() {
    if (typeof this.provider.disconnect === 'function') {
      return this.provider.disconnect();
    }

    return this.request('disconnect');
  }

  async signMessage(message, encoding = 'utf8') {
    const normalized = this.normalizeMessage(message);

    if (typeof this.provider.signMessage === 'function') {
      return this.provider.signMessage(normalized, encoding);
    }

    return this.request('signMessage', [normalized, { encoding }]);
  }

  async signTransaction(transaction) {
    if (typeof this.provider.signTransaction === 'function') {
      return this.provider.signTransaction(transaction);
    }

    return this.request('signTransaction', [transaction]);
  }

  async sendTransaction(transaction, connection, options = {}) {
    const signedTransaction = await this.signTransaction(transaction);
    const rawTransaction = signedTransaction.serialize();
    const signature = await connection.sendRawTransaction(rawTransaction, options);
    await connection.confirmTransaction(signature);
    return signature;
  }
}

class Phantom {
  static get provider() {
    return window?.phantom?.app || window?.phantom?.solana || window?.solana || null;
  }

  static get wallet() {
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

    const adapter = new Gu(provider);
    window.phantom = window.phantom || {};
    window.phantom.app = adapter;
    return adapter;
  }

  static isInstalled() {
    return Boolean(window?.phantom?.app || window?.solana);
  }

  static async requestAccount() {
    const wallet = this.wallet;

    if (!wallet) {
      throw new Error('Phantom wallet not detected');
    }

    return wallet.requestAccount();
  }

  static async signMessage(message) {
    const wallet = this.wallet;

    if (!wallet) {
      throw new Error('Phantom wallet not detected');
    }

    return wallet.signMessage(message);
  }

  static async signTransaction(transaction) {
    const wallet = this.wallet;

    if (!wallet) {
      throw new Error('Phantom wallet not detected');
    }

    return wallet.signTransaction(transaction);
  }

  static async sendTransaction(transaction, connection, options = {}) {
    const wallet = this.wallet;

    if (!wallet) {
      throw new Error('Phantom wallet not detected');
    }

    return wallet.sendTransaction(transaction, connection, options);
  }

  static createDeepLinkUrl({
    appUrl = window.location.origin,
    redirectUrl = window.location.href,
    cluster = DEFAULT_CLUSTER,
    alwaysOpenInApp = false,
  } = {}) {
    const baseUrl = alwaysOpenInApp ? 'phantom://app/ul/v1/connect' : DEFAULT_PHANTOM_DEEP_LINK;
    const params = new URLSearchParams({
      app_url: appUrl,
      redirect_url: redirectUrl,
      cluster,
    });

    return `${baseUrl}?${params.toString()}`;
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

export { Phantom, Oh, Gu };
