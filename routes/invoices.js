const express = require("express");
const router = new express.Router();
const db = require ("../db");
const ExpressError = require("../expressError");

router.get("/", async function(req, res, next) {
    try {
        const results = await db.query("SELECT id, comp_code FROM invoices");
        return res.json({invoices: results.rows});
    } catch(err) {
        return next(err);
    }
});

router.get("/:id", async function(req, res, next) {
    try {
        const results = await db.query(`SELECT I.id, I.amt, I.paid, I.add_date, I.paid_date,
                                        C.code, C.name, C.description 
                                        FROM invoices AS I JOIN companies AS C
                                        ON  I.comp_code = C.code
                                        WHERE I.id = $1`, [req.params.id]);
        if (!results.rows[0]) {
            throw new ExpressError("Invoice ID not found", 404);
        }
        const data = results.rows[0];
        const invoice = {
            invoice : {
                id: data.id,
                amt: data.amt,
                paid: data.paid,
                add_date: data.add_date,
                paid_date: data.paid_date,
                company: {
                    code: data.code,
                    name: data.name,
                    description: data.description
                }
            }

        }
        return res.json(invoice);
    } catch(err) {
        return next(err);
    }
});

router.post("/", async function(req, res, next) {
    try {
        const { comp_code, amt } = req.body;

        const results = await db.query(`INSERT INTO invoices (comp_code, amt) 
                                        VALUES ($1, $2) 
                                        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
        return res.json({invoice: results.rows});
    } catch(err) {
        return next(err);
    }
});

router.put("/:id", async function(req, res, next) {
    try {
        const { amt, paid } = req.body;
        let paydate = null;

        const currResults = await db.query(`SELECT paid FROM invoices WHERE id = $1`, [req.params.id]);
        if (!currResults.rows[0]) {
            throw new ExpressError("Invoice ID not found", 404);
        }
        const currPaidDate = currResults.rows[0].paid_date;

        if(!currPaidDate && paid) {
            paydate = new Date();
        } else if (!paid) {
            paydate = null;
        } else {
            paydate = currPaidDate;
        }

        const results = await db.query(`UPDATE invoices SET amt = $1, paid = $2, paid_date = $3
                                        WHERE id = $4
                                        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, paydate, req.params.id]);
        
        return res.json({invoice: results.rows}); 
    } catch(err) {
        return next(err);
    }
});

router.delete("/:id", async function(req, res, next) {
    try { 
        const results = await db.query(`DELETE FROM invoices
                                        WHERE id = $1
                                        RETURNING comp_code`, [req.params.id]);
        console.log(results);
        if (!results.rows[0]) {
            throw new ExpressError("Invoice ID not found", 404);
        }
        return res.json({status: "Deleted"});
    } catch(err) {
        return next(err);
    }
});


module.exports = router;