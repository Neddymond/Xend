const https = require('https');
const axios = require("axios").default;
const express = require("express");
const router = new express.Router();
const Recipient = require("../models/recipient");
const auth = require("../middleware/auth");

const axiosInstance = axios.default.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.SECRET_KEY}`
  }
});

let transfer_code;

/** Verify recipient account nummber and create transfer recipient */
router.post("/verify", async (req, res) => {
  console.log(req.body.account_number, req.body.bank_code, process.env.SECRET_KEY)
  try {
    //Verify recipient account number
    const verifyResBody = await axiosInstance.get("/bank/resolve", {
      params: {
        account_number: req.body.account_number,
        bank_code: req.body.bank_code
      }
    });

    if (!verifyResBody.status) {
      return res.status(404).send({ message: "Account number not found."})
    };

    // console.log(verifyResBody);

    //Create transfer recipient
    const recipientResBody = await axiosInstance.post("/transferrecipient", {
      type: "nuban",
      name: verifyResBody.data.data.account_name,
      account_number: verifyResBody.data.data.account_number,
      bank_code: req.body.bank_code,
      currency: "NGN"
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // console.log(recipientResBody);

    if (!recipientResBody.status) {
      return res.status(400).send({ message: "Transfer recipient creation failed" });
    };

    // Save recipient's code and details to DB
    const recipient = new Recipient({
      type: recipientResBody.data.data.type,
      name: recipientResBody.data.data.name,
      acc_num: recipientResBody.data.data.details.account_number,
      recipient_code: recipientResBody.data.data.recipient_code,
      bank_code: recipientResBody.data.data.details.bank_code,
      bank_name: recipientResBody.data.data.details.bank_name,
      currency: recipientResBody.data.data.currency
    });

    await recipient.save();

    const token = await recipient.GenerateAuthToken();

    // console.log(recipient);
    res.status(200).json({ recipient: recipient, token: token });
  } catch(e) {
    res.status(500).send(e);
  }
});

router.post("/transfer", auth, async (req, res) => {
  const recipient = req.recipient_code;
  const amount = Number(req.body.amount) * 100; // Convert to kobo
  const source = "balance";
  const reason = req.body.reason;

  console.log(recipient);

  try {
    // Transfer money
    const transferResBody = await axiosInstance.post("/transfer", {
      source,
      amount,
      recipient,
      reason
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(transferResBody);

    if (!transferResBody.status) {
      return res.status(400).send({ message: "Could not make a transfer" });
    }

    transfer_code = transferResBody.data.transfer_code;
    res.json(transferResBody.data);
  } catch (e) {
    res.status(500).send(e);
  }
});

/**Finalize money transfer */
router.post("/finalizeTransfer", auth, async (req, res) => {
  const otp = req.body.otp;

  try {
    const transferResBody = await axiosInstance.post("/transfer/finalize_transfer", {
      transfer_code,
      otp
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!transferResBody.status) {
      return res.status(500).send(e);
    }

    res.json(transferResBody.data);
  } catch (e) {
    res.status(e).send(e);
  }
});

/** List Transfer History */
router.post("ListTransfers", auth, async (req, res) => {
  const customer_id = req.recipient._id;

  try {
    const transfers = await axiosInstance.get(`transfer?customer`, {
      params: {
        customer: customer_id
      }
    });

    if (!transfers.status) {
      return res.status(404).send({ message: "No transfers found."});
    };
  } catch (e) {
    res.status(500).send(e);
  }
});

/** Search Transfer History */
router.post("searchTransfer", auth, async (req, res) => {
  try {
    const transfer = await axiosInstance.get(`transfer/:id_or_code`);

    if (!transfer.status) {
      return res.status(404).send({ message: "Transfer not found."});
    };

    res.json(transfer.data);
  } catch (e) {
    res.status(500).send(e);
  }
});


module.exports = router;