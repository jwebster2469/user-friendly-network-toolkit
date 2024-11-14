const { Client, Environment } = require('square');
const logger = require('../utils/logger');
const config = require('../../config/config');

class PaymentService {
    constructor() {
        this.client = new Client({
            accessToken: config.square.accessToken,
            environment: config.square.environment === 'production' 
                ? Environment.Production 
                : Environment.Sandbox
        });
        
        this.paymentsApi = this.client.paymentsApi;
        this.customersApi = this.client.customersApi;
        this.subscriptionsApi = this.client.subscriptionsApi;
    }

    /**
     * Process a payment
     * @param {Object} paymentDetails - Payment details
     * @returns {Promise<Object>} Payment result
     */
    async processPayment({
        amount,
        currency = 'USD',
        sourceId,
        customerId,
        description,
        metadata = {}
    }) {
        try {
            const payment = {
                sourceId,
                amountMoney: {
                    amount: Math.round(amount * 100), // Convert to cents
                    currency
                },
                locationId: config.square.locationId,
                idempotencyKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            };

            if (customerId) {
                payment.customerId = customerId;
            }

            if (description) {
                payment.note = description;
            }

            if (Object.keys(metadata).length > 0) {
                payment.metadata = metadata;
            }

            const { result } = await this.paymentsApi.createPayment(payment);

            logger.info('Payment processed successfully', {
                paymentId: result.payment.id,
                amount: amount,
                currency: currency,
                customerId: customerId
            });

            return {
                success: true,
                paymentId: result.payment.id,
                status: result.payment.status,
                receipt: result.payment.receiptUrl
            };

        } catch (error) {
            logger.error('Payment processing failed', {
                error: error.message,
                code: error.code,
                details: error.details
            });

            throw {
                success: false,
                error: 'Payment processing failed',
                details: error.message,
                code: error.code
            };
        }
    }

    /**
     * Create or update customer
     * @param {Object} customerDetails - Customer details
     * @returns {Promise<Object>} Customer result
     */
    async upsertCustomer({
        customerId,
        email,
        phoneNumber,
        firstName,
        lastName,
        company,
        metadata = {}
    }) {
        try {
            const customerData = {
                emailAddress: email,
                phoneNumber,
                givenName: firstName,
                familyName: lastName,
                companyName: company,
                referenceId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            };

            if (Object.keys(metadata).length > 0) {
                customerData.metadata = metadata;
            }

            let result;
            if (customerId) {
                result = await this.customersApi.updateCustomer(customerId, { customer: customerData });
            } else {
                result = await this.customersApi.createCustomer({ idempotencyKey: customerData.referenceId, customer: customerData });
            }

            logger.info('Customer upserted successfully', {
                customerId: result.customer.id,
                email: email
            });

            return {
                success: true,
                customerId: result.customer.id,
                customer: result.customer
            };

        } catch (error) {
            logger.error('Customer upsert failed', {
                error: error.message,
                code: error.code,
                details: error.details
            });

            throw {
                success: false,
                error: 'Customer operation failed',
                details: error.message,
                code: error.code
            };
        }
    }

    /**
     * Create subscription
     * @param {Object} subscriptionDetails - Subscription details
     * @returns {Promise<Object>} Subscription result
     */
    async createSubscription({
        customerId,
        planId,
        startDate,
        metadata = {}
    }) {
        try {
            const subscription = {
                customerId,
                planId,
                startDate: startDate || new Date().toISOString(),
                locationId: config.square.locationId,
                metadata
            };

            const { result } = await this.subscriptionsApi.createSubscription({
                idempotencyKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                subscription
            });

            logger.info('Subscription created successfully', {
                subscriptionId: result.subscription.id,
                customerId: customerId,
                planId: planId
            });

            return {
                success: true,
                subscriptionId: result.subscription.id,
                status: result.subscription.status,
                subscription: result.subscription
            };

        } catch (error) {
            logger.error('Subscription creation failed', {
                error: error.message,
                code: error.code,
                details: error.details
            });

            throw {
                success: false,
                error: 'Subscription creation failed',
                details: error.message,
                code: error.code
            };
        }
    }

    /**
     * Get payment status
     * @param {string} paymentId - Payment ID
     * @returns {Promise<Object>} Payment status
     */
    async getPaymentStatus(paymentId) {
        try {
            const { result } = await this.paymentsApi.getPayment(paymentId);

            return {
                success: true,
                status: result.payment.status,
                payment: result.payment
            };

        } catch (error) {
            logger.error('Payment status check failed', {
                error: error.message,
                paymentId: paymentId
            });

            throw {
                success: false,
                error: 'Payment status check failed',
                details: error.message
            };
        }
    }

    /**
     * Refund payment
     * @param {Object} refundDetails - Refund details
     * @returns {Promise<Object>} Refund result
     */
    async refundPayment({
        paymentId,
        amount,
        currency = 'USD',
        reason
    }) {
        try {
            const refund = {
                paymentId,
                amountMoney: {
                    amount: Math.round(amount * 100), // Convert to cents
                    currency
                },
                idempotencyKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            };

            if (reason) {
                refund.reason = reason;
            }

            const { result } = await this.paymentsApi.refundPayment(refund);

            logger.info('Payment refunded successfully', {
                refundId: result.refund.id,
                paymentId: paymentId,
                amount: amount
            });

            return {
                success: true,
                refundId: result.refund.id,
                status: result.refund.status,
                refund: result.refund
            };

        } catch (error) {
            logger.error('Payment refund failed', {
                error: error.message,
                paymentId: paymentId
            });

            throw {
                success: false,
                error: 'Payment refund failed',
                details: error.message
            };
        }
    }
}

module.exports = new PaymentService();
