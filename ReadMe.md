XEND TRANSFER

ENDPOINTS

GET /verify: is used to verify whether a recipient's account number is valid.
Query Params required:
- account_number
- bank_code

POST /transferrecipient: is used to create a transfer recipient. If successfully created, the recipient is saved to DB
Query Params required:
- acc_name
- acc_num
- bank_code

POST /transfer: This endpoint transfers money to a recipient.
Query Params required:
- amount
- reason

POST /finalizetransfer: is used to finalize an initiated transfer.
Query Params required:
- transfer_code
- otp

GET /transferhistory: is used to fetch the transfer history of a recipient

GET /searchtransfer: is used to search for a specific transfer
Query Params required:
id_or_code