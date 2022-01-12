const express = require("express");
const router = new express.Router();
const db = require ("../db");
const ExpressError = require("../expressError");

router.get("/", async function(req, res, next) {
    try {
        const results = await db.query("SELECT code, name FROM companies");
        return res.json({companies: results.rows});
    } catch(err) {
        return next(err);
    }
});

router.get("/:id", async function(req, res, next) {
    try {
        const compResults = await db.query(`SELECT code, name, description
                                            FROM companies
                                            WHERE code = $1`, [req.params.id]);
        if (!compResults.rows[0]) {
            throw new ExpressError("Company code not found", 404);
        }
        const invoResults = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [req.params.id]);

        const company = compResults.rows[0];
        const invoices = invoResults.rows;

        company.invoices = invoices.map(inv => inv.id);

        return res.json({"company": company});

    } catch(err) {
        return next(err);
    }
});

router.post("/", async function(req, res, next) {
    try {
        const { code, name, description} = req.body;

        const results = await db.query(`INSERT INTO companies(code, name, description) 
                                        VALUES ($1, $2, $3) 
                                        RETURNING code, name, description`, [code, name, description]);
        return res.json({company: results.rows});
    } catch(err) {
        return next(err);
    }
});

router.put("/:id", async function(req, res, next) {
    try {
        const { name, description } = req.body;

        const results = await db.query(`UPDATE companies SET name = $1, description = $2 
                                        WHERE code = $3 
                                        RETURNING code, name, description`, [name, description, req.params.id]);
        if (!results.rows[0]) {
            throw new ExpressError("Company code not found", 404);
        }
        return res.json({company: results.rows}); 
    } catch(err) {
        return next(err);
    }
});

router.delete("/:id", async function(req, res, next) {
    try { 
        const results = await db.query(`DELETE FROM companies 
                                        WHERE code = $1 
                                        RETURNING code, name, description`, [req.params.id]);
        if (!results.rows[0]) {
            throw new ExpressError("Company code not found", 404);
        }
        return res.json({status: "Deleted"});
    } catch(err) {
        return next(err);
    }
});


module.exports = router;