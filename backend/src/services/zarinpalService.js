const axios = require('axios');

class ZarinpalService {
  constructor() {
    this.merchantId = process.env.ZARINPAL_MERCHANT_ID;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.baseURL = this.isProduction
      ? 'https://api.zarinpal.com/pg/v4'
      : 'https://sandbox.zarinpal.com/pg/v4';
  }

  async requestPayment({
    amount,
    callbackUrl,
    description,
    email,
    mobile
  }) {
    try {
      const response = await axios.post(`${this.baseURL}/payment/request.json`, {
        merchant_id: this.merchantId,
        amount: amount * 10, // Convert Toman to Rial
        callback_url: callbackUrl,
        description,
        metadata: {
          email,
          mobile
        }
      });

      if (response.data.data.code === 100) {
        return {
          success: true,
          authority: response.data.data.authority,
          gatewayUrl: this.isProduction
            ? `https://www.zarinpal.com/pg/StartPay/${response.data.data.authority}`
            : `https://sandbox.zarinpal.com/pg/StartPay/${response.data.data.authority}`
        };
      }

      return {
        success: false,
        error: `Zarinpal Error: ${response.data.errors.message}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyPayment({ amount, authority }) {
    try {
      const response = await axios.post(`${this.baseURL}/payment/verify.json`, {
        merchant_id: this.merchantId,
        amount: amount * 10, // Convert Toman to Rial
        authority
      });

      if (response.data.data.code === 100) {
        return {
          success: true,
          refId: response.data.data.ref_id
        };
      }

      return {
        success: false,
        error: `Zarinpal Error: ${response.data.errors.message}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ZarinpalService(); 