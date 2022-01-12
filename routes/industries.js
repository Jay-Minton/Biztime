const express = require("express");
const router = new express.Router();
const db = require ("../db");
const slugify = require("slugify");
const ExpressError = require("../expressError");

router.get("/", async function(req, res, next) {
    try {
        const results = await db.query(`SELECT I.industry, C.comp_code 
                                        FROM industries AS I JOIN companies_industries AS C
                                        ON I.code = C.indy_code`);
        return res.json({industries: results.rows});
    } catch(err) {
        return next(err);
    }
});

router.post("/", async function(req, res, next) {
    try {
        const { industry } = req.body;
        const code = slugify(industry);

        const results = await db.query(`INSERT INTO industries(code, industry) 
                                        VALUES ($1, $2) 
                                        RETURNING code, industry`, [code, industry]);
        return res.json({industry: results.rows});
    } catch(err) {
        return next(err);
    }
});  

router.put("/:id", async function(req, res, next) {
    try {
        const { code } = req.body;
        const trial1 = await db.query(`SELECT * FROM industries WHERE code = $1`, [req.params.id])
        if (!trial1.rows[0]) {
            throw new ExpressError("Industry Code not found", 404);
        }
        const trial2 = await db.query(`SELECT * FROM companies WHERE code = $1`, [code])
        if (!trial2.rows[0]) {
            throw new ExpressError("Company Code not found", 404);
        }

        const results = await db.query(`INSERT INTO companies_industries(comp_code, indy_code)
                                        VALUES ($1, $2)
                                        RETURNING comp_code`, [code, req.params.id]);
        return res.json({"Status": "Added"}); 
    } catch(err) {
        return next(err);
    }
});
module.exports = router;