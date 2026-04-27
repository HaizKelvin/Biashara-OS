# Security Specification for SME Money OS Kenya

## 1. Data Invariants
- A business must have an owner who is the first user added.
- Only business owners can add/remove staff users.
- Sales, Expenses, Inventory, and Debts must all belong to a valid business.
- Users can only access data belonging to the business they are associated with.
- Critical financial fields (amounts, prices) must be positive numbers.
- Timestamps must be server-validated.

## 2. The "Dirty Dozen" Payloads (Unauthorized Attempts)

1.  **Identity Spoofing**: Attempt to create a sale with a `userId` that isn't the current requester's UID.
2.  **Cross-Business Leak**: Attempt to read sales from a `businessId` the user doesn't belong to.
3.  **Owner Escalation**: A staff user attempting to change their own role to 'owner' in the `users` collection.
4.  **Shadow Field Injection**: Adding an `isAdmin: true` field to a user profile during creation.
5.  **Inventory Poisoning**: Updating a product's `costPrice` to a negative value or a huge string.
6.  **Debt Erasure**: A customer (if they had access) or unauthorized user attempting to mark a debt as 'paid' without proper authorization.
7.  **Resource Exhaustion**: Using a 1MB string as a `saleId` or customer name.
8.  **Orphaned Sale**: Creating a sale for a `businessId` that doesn't exist.
9.  **Time Travel**: Providing a client-side `timestamp` from 2005.
10. **Global Scrape**: Attempting to list ALL businesses in the system without a filter.
11. **PII Leak**: A staff user trying to read the owner's private contact details (if stored in a restricted subcollection).
12. **Terminal State Break**: Attempting to edit a 'paid' debt back to 'pending' after it has been settled.

## 3. Test Runner
(Internal logic will verify these against rules)
