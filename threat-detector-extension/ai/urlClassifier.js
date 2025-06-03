// AI-powered URL classification using TensorFlow.js
import * as tf from '@tensorflow/tfjs';

class URLClassifier {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.features = {
      // URL structure features
      urlLength: 0,
      domainLength: 0,
      pathLength: 0,
      queryLength: 0,
      fragmentLength: 0,
      
      // Character analysis
      specialCharCount: 0,
      digitCount: 0,
      hyphenCount: 0,
      underscoreCount: 0,
      
      // Domain features
      subdomainCount: 0,
      isIPAddress: false,
      hasPort: false,
      
      // Suspicious patterns
      hasPhishingKeywords: false,
      hasSuspiciousExtension: false,
      hasRedirect: false,
      
      // Security indicators
      isHTTPS: false,
      hasValidTLD: false
    };
  }

  /**
   * Initialize and load the TensorFlow.js model
   */
  async loadModel() {
    try {
      // For now, create a simple neural network
      // In production, this would load a pre-trained model
      this.model = await this.createModel();
      this.isLoaded = true;
      console.log('URL Classifier model loaded successfully');
    } catch (error) {
      console.error('Error loading URL Classifier model:', error);
      throw error;
    }
  }

  /**
   * Create a simple neural network for URL classification
   */
  async createModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [20], // Number of features
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid' // Binary classification (safe/malicious)
        })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Extract features from a URL
   */
  extractFeatures(url) {
    try {
      const urlObj = new URL(url);
      const features = { ...this.features };

      // Basic URL structure
      features.urlLength = url.length;
      features.domainLength = urlObj.hostname.length;
      features.pathLength = urlObj.pathname.length;
      features.queryLength = urlObj.search.length;
      features.fragmentLength = urlObj.hash.length;

      // Character analysis
      features.specialCharCount = (url.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
      features.digitCount = (url.match(/\d/g) || []).length;
      features.hyphenCount = (url.match(/-/g) || []).length;
      features.underscoreCount = (url.match(/_/g) || []).length;

      // Domain features
      features.subdomainCount = urlObj.hostname.split('.').length - 2;
      features.isIPAddress = /^\d+\.\d+\.\d+\.\d+$/.test(urlObj.hostname) ? 1 : 0;
      features.hasPort = urlObj.port ? 1 : 0;

      // Suspicious patterns
      features.hasPhishingKeywords = this.checkPhishingKeywords(url) ? 1 : 0;
      features.hasSuspiciousExtension = this.checkSuspiciousExtension(url) ? 1 : 0;
      features.hasRedirect = url.includes('redirect') || url.includes('r=') ? 1 : 0;

      // Security indicators
      features.isHTTPS = urlObj.protocol === 'https:' ? 1 : 0;
      features.hasValidTLD = this.checkValidTLD(urlObj.hostname) ? 1 : 0;

      return Object.values(features);
    } catch (error) {
      console.error('Error extracting features from URL:', error);
      return new Array(20).fill(0); // Return default features
    }
  }

  /**
   * Check for common phishing keywords
   */
  checkPhishingKeywords(url) {
    const phishingKeywords = [
      'secure', 'account', 'update', 'confirm', 'verify', 'login',
      'signin', 'banking', 'paypal', 'amazon', 'microsoft', 'apple',
      'google', 'facebook', 'suspended', 'limited', 'restricted'
    ];

    const lowerUrl = url.toLowerCase();
    return phishingKeywords.some(keyword => lowerUrl.includes(keyword));
  }

  /**
   * Check for suspicious file extensions
   */
  checkSuspiciousExtension(url) {
    const suspiciousExtensions = [
      '.exe', '.scr', '.bat', '.com', '.pif', '.vbs', '.js',
      '.jar', '.zip', '.rar', '.7z', '.dmg', '.pkg'
    ];

    const lowerUrl = url.toLowerCase();
    return suspiciousExtensions.some(ext => lowerUrl.includes(ext));
  }

  /**
   * Check if domain has a valid TLD
   */
  checkValidTLD(hostname) {
    const validTLDs = [
      '.com', '.org', '.net', '.edu', '.gov', '.mil', '.int',
      '.co', '.io', '.ai', '.tech', '.info', '.biz', '.name'
    ];

    const lowerHostname = hostname.toLowerCase();
    return validTLDs.some(tld => lowerHostname.endsWith(tld));
  }

  /**
   * Classify a URL as safe or malicious
   */
  async classifyURL(url) {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    try {
      const features = this.extractFeatures(url);
      const inputTensor = tf.tensor2d([features]);
      
      const prediction = await this.model.predict(inputTensor);
      const score = await prediction.data();
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      const threatScore = score[0];
      const isThreat = threatScore > 0.5;

      return {
        isThreat,
        threatScore,
        confidence: Math.abs(threatScore - 0.5) * 2, // Convert to 0-1 confidence
        classification: isThreat ? 'malicious' : 'safe',
        features: {
          urlLength: features[0],
          hasPhishingKeywords: features[13] === 1,
          isHTTPS: features[18] === 1,
          hasValidTLD: features[19] === 1
        }
      };
    } catch (error) {
      console.error('Error classifying URL:', error);
      return {
        isThreat: false,
        threatScore: 0,
        confidence: 0,
        classification: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Train the model with new data (for future enhancement)
   */
  async trainModel(trainingData) {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    try {
      const features = trainingData.map(item => this.extractFeatures(item.url));
      const labels = trainingData.map(item => item.isMalicious ? 1 : 0);

      const xs = tf.tensor2d(features);
      const ys = tf.tensor2d(labels, [labels.length, 1]);

      await this.model.fit(xs, ys, {
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
          }
        }
      });

      // Clean up tensors
      xs.dispose();
      ys.dispose();

      console.log('Model training completed');
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  /**
   * Save the trained model
   */
  async saveModel(path = 'localstorage://url-classifier-model') {
    if (!this.isLoaded) {
      throw new Error('Model not loaded');
    }

    try {
      await this.model.save(path);
      console.log('Model saved successfully');
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    }
  }

  /**
   * Load a pre-trained model
   */
  async loadPretrainedModel(path = 'localstorage://url-classifier-model') {
    try {
      this.model = await tf.loadLayersModel(path);
      this.isLoaded = true;
      console.log('Pre-trained model loaded successfully');
    } catch (error) {
      console.error('Error loading pre-trained model:', error);
      // Fall back to creating a new model
      await this.loadModel();
    }
  }
}

// Export singleton instance
export const urlClassifier = new URLClassifier();
export default URLClassifier;
