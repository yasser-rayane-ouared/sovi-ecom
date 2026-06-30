---
name: Store Operations & Fraud Prevention
description: Instructions on managing orders, tracking shipments (Yalidine/ZR), configuring security rate limits, OTP checkouts, and managing team workers permissions.
---

# Store Operations & Fraud Prevention Guide

This guide describes standard operational workflows, shipment tracking automation, and security setup for store protection.

---

## 1. Order Lifecycle & Status Management

### COD Order Statuses
Merchants process Cash on Delivery (COD) orders via the following standard statuses:
*   `new`: Order newly created.
*   `no_answer`, `no_answer_1`, `no_answer_2`, `no_answer_3`: Client did not answer phone confirmation calls.
*   `postponed`: Client requested to postpone delivery.
*   `confirmed`: Order confirmed by call center agent.
*   `prepared`: Order packed and ready for shipping.
*   `shipped`: Handed over to Yalidine or ZR Express.
*   `delivered`: Package successfully delivered and paid.
*   `returned`: Package returned back to store inventory (*Retour*).
*   `cancelled`: Order cancelled by customer/merchant.

### Automatic Yalidine Status Sync
*   Sovi has a built-in background sync worker that polls Yalidine status updates automatically every 2 hours.
*   The worker moves packages through (*In Transit -> Out for Delivery -> Delivered / Returned*) and instantly updates the status column in the merchant's **Google Sheet**.

---

## 2. Store Security & Anti-Fraud Settings

To prevent fake orders and spam from competitor bots, Sovi provides several security tools:
*   **Phone Number Format Validation:** Automatically checks that the input is a valid Algerian mobile number format (`05`, `06`, `07`, or `213` prefix).
*   **Firebase SMS OTP Verification:** Requires verification code authentication before checkout is submitted.
*   **Google reCAPTCHA v3:** Blocks automated bots by analyzing user interaction scores.
*   **IP-Based Rate Limiting:** Limits the number of checkout orders allowed per day from a single IP address.
*   **Algerian IP Lock:** Blocks non-Algerian IP addresses from placing orders.

---

## 3. Team Workers & Access Permissions
*   Merchants can create worker profiles (call center, packagers, admins) to delegate tasks.
*   Ensure workers are granted limited scopes (e.g., call centers can only view orders and update statuses; they shouldn't edit product prices or delete theme layouts).
