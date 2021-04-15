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

// let transfer_code;

router.get("/say/:greet", async (req, res) => {
  const greeting = req.params.greet;
  res.json(greeting);
});

/** Verify recipient account nummber */
router.get("/verify", async (req, res) => {
  // console.log(req.body.account_number, req.body.bank_code, process.env.SECRET_KEY)
  try {
    const verifyResBody = await axiosInstance.get("/bank/resolve", {
      params: {
        account_number: req.query.account_number,
        bank_code: req.query.bank_code
      }
    });

    if (!verifyResBody.status) {
      return res.status(404).send({ message: "Account number not found."})
    };

    // console.log(verifyResBody);
    res.json(verifyResBody.data);
  } catch(e) {
    res.status(500).send(e);
  }
});

/** Create a transfer recipient and save recipient to DB */
router.post("/transferrecipient", async (req, res) => {
  try {
    const recipientResBody = await axiosInstance.post("/transferrecipient", {
      type: "nuban",
      name: req.query.acc_name,
      account_number: req.query.acc_num,
      bank_code: req.query.bank_code,
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

    // res.json(recipientResBody.data);

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
    res.status(200).json({ recipient: recipientResBody.data, token: token });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/transfer", auth, async (req, res) => {
  const recipient = req.recipient_code;
  const amount = Number(req.query.amount) * 100; // Convert to kobo
  const source = "balance";
  const reason = req.query.reason;

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

    res.json(transferResBody.data);
  } catch (e) {
    res.status(500).send(e);
  }
});

/**Finalize money transfer */
router.post("/finalizetransfer", auth, async (req, res) => {
  const transfer_code = req.query.transfer_code;
  const otp = req.query.otp;

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
router.get("/transferhistory", auth, async (req, res) => {
  // const customer_id = req.recipient._id;

  try {
    const transfers = await axiosInstance.get(`transfer`);
    // console.log(transfers);

    if (!transfers.status) {
      return res.status(404).send({ message: "No transfers found."});
    };

    res.json(transfers.data);
  } catch (e) {
    res.status(500).send(e);
  }
});

/** Search Transfer History */
router.get("/searchtransfer", auth, async (req, res) => {
  const transfer_code = req.query.id_or_code;
  try {
    const transfer = await axiosInstance.get(`/transfer/${transfer_code}`);
    console.log(transfer);

    if (!transfer.status) {
      return res.status(404).send({ message: "Transfer not found."});
    };

    res.json(transfer.data);
  } catch (e) {
    res.status(500).send(e);
  }
});


module.exports = router;