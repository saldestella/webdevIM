const express = require('express');
const app = express();
const port = 5000; 
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcrypt');

app.use(cors({
  origin: ['http://localhost:5173']
}));

app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: "",
  database: "tigum_data"
});

db.connect((error) => {
  if(error) {
    console.log("Error connecting to database");
  } else {
    console.log("Connected");
  }
});

app.get('/test', (req, res) => {
  res.send(req.session);
  console.log(req.session);
});

app.post('/register', (req, res) => {
  const {firstname, lastname, email, password} = req.body;
  console.log(firstname, lastname, email, password);
  const emailSearch = `SELECT * FROM users WHERE email = ?`;
  let emailTaken = false;
    db.query(emailSearch, [email], (error, result) => {
        if(result.length>0){
          emailTaken = true;
          return res.status(401).json({message: "Email Taken"});
        }
        if(!emailTaken) {
            const sql = `INSERT INTO users(firstname, lastname, email, password) VALUES (?, ?, ?, ?)`;
            
            db.query(sql, [firstname, lastname, email, password], (error, result) => {
              console.log("Success");
              if(error){
                console.log(error);
              }
              if(result){
                console.log(result);
                return res.json({result:result});
              }
            })
      }
    })
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  const sql = `SELECT * FROM users WHERE email = ?`;
  db.query(sql, [email], (error, result) => {
    if(error){
      console.log(error);
      return res.status(401).json({message: "Email not found"});
    }
    if(result && result.length > 0){
      const user = result[0];
        if(user.password === password){
          return res.json({user:user});
        } else {
          return res.status(401).json({message: "Wrong Password"});
        }
    } else {
      return res.status(401).json({message: "There is an error while logging in"});
    }
  })
});

app.post('/addbudget', (req, res) => {
    const {id, title, amount, startDate, endDate} = req.body;
    console.log(id, title, amount, startDate, endDate);
    const sql = `INSERT INTO budget(user_id, budget_name, budget_amount, budget_start_date, budget_end_date) VALUES (?, ?, ?, ?, ?)`;
    if(id != null){
      db.query(sql, [id, title, amount, startDate, endDate], (error, result) => {
        if(error){
          console.log(error);
        }
        if(result){
          return res.json({result:result});
        }
      })
    }
});

app.get('/getbudgets/:id', (req, res) => {
  const userId = req.params.id;
  const sql = `SELECT * FROM budget WHERE user_id = ? && is_deleted = 0`;
  db.query(sql, [userId], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  })
});

app.post('/addexpense', (req, res) => {
  const { bud_id, expenseName, expenseAmount, expenseCategory } = req.body;
  console.log(bud_id, expenseName, expenseAmount, expenseCategory);
  const sql = `INSERT INTO expenses(budget_id, expense_name, expense_amount, expense_category) VALUES (?, ?, ?, ?)`;
  db.query(sql, [bud_id, expenseName, expenseAmount, expenseCategory], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  })
});

app.get('/getexpenses/:budId', (req, res) => {
  const budId = req.params.budId;
  const sql = `SELECT * FROM expenses WHERE budget_id = ? ORDER BY expense_time DESC`;
  db.query(sql, [budId], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  });
});


app.get('/getallexpenses/:id', (req, res) => {
  const id = req.params.id;
  console.log(id);
  const sql = `SELECT * FROM expenses LEFT JOIN budget on expenses.budget_id = budget.budget_id WHERE user_id = ? ORDER BY expense_time DESC`;
  db.query(sql, [id], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  });
});

app.put(`/updateexpense/:updateId`, (req, res) => {
  const id = req.params.updateId;
  const { expenseName, expenseAmount, expenseCategory } = req.body;
  db.query(`UPDATE expenses SET expense_name = ?, expense_amount = ?, expense_category = ? WHERE expense_id = ?`, [expenseName, expenseAmount, expenseCategory, id], 
  (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  });
})

app.delete(`/deleteexpense/:deleteId`, (req, res) => {
  const id = req.params.deleteId;
  db.query(`DELETE FROM expenses WHERE expense_id = ?`, [id], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  });
})

app.put(`/updatebudget/:updateId`, (req, res) => {
  const id = req.params.updateId;
  const {title, amount, endDate} = req.body;
  db.query(`UPDATE budget SET budget_name = ?, budget_amount = ?, budget_end_date = ? WHERE budget_id = ?`, [title, amount, endDate, id],
  (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  });
})

app.put(`/deletebudget/:deleteId`, (req, res) => {
  const id = req.params.deleteId;
  db.query(`UPDATE budget SET is_deleted = 1 WHERE budget_id = ?`, [id], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  });
});

app.get(`/getexpensesinbud/:budId`, (req, res) => {
  const budId = req.params.budId;
  db.query(`SELECT * FROM expenses WHERE budget_id = ?`, [budId], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  });
})

app.get(`/getreminders/:id`, (req, res) => {
  const id = req.params.id;
  db.query(`SELECT * FROM reminders WHERE user_id = ? && isPaid = 0 ORDER BY reminder_date ASC`, [id], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      console.log(result);
      return res.json({result:result});
    }
  });
})

app.post(`/addreminder`, (req, res) => {
  const {reminder_name, reminder_date, reminder_amount, bud_name,bud_id, reminder_category, user_id } = req.body;  
  const sql = `INSERT INTO reminders(user_id, budget_id,reminder_name, reminder_category, reminder_date, budget_name, reminder_amount) VALUES (?, ?, ?, ?, ?, ?, ?) `;
  db.query(sql, [user_id, bud_id, reminder_name, reminder_category, reminder_date, bud_name, reminder_amount], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      console.log(result);
      return res.json({result:result});
    }
  });
})

app.post(`/payreminder`, (req, res) => {
  const { reminder_id, reminder_name, reminder_amount, bud_id, reminder_category } = req.body;

  const insertSQL = `INSERT INTO expenses (budget_id, expense_name, expense_amount, expense_category) VALUES (?, ?, ?, ?)`;
  const updateSQL = `UPDATE reminders SET isPaid = 1 WHERE reminder_id = ?`;

  db.query(insertSQL, [bud_id, reminder_name, reminder_amount, reminder_category], (insertError, insertResult) => {
    if (insertError) {
      console.log(insertError);
      return res.status(500).json({ error: "Error inserting into expenses" });
    }
    db.query(updateSQL, [reminder_id], (updateError, updateResult) => {
      if (updateError) {
        console.log(updateError);
        return res.status(500).json({ error: "Error updating reminders" });
      }

      console.log(updateResult);
      return res.json({ result: updateResult });
    });
  });
});

app.put(`/updatereminder`, (req, res) => {
  const {reminder_id, reminder_name, reminder_date, reminder_amount, reminder_category, bud_id, budget_name} = req.body;
  db.query(`UPDATE reminders SET budget_id = ?, reminder_name = ?, reminder_date = ?,budget_name = ?, reminder_amount = ?, reminder_category = ? WHERE reminder_id = ?`,
  [bud_id, reminder_name, reminder_date, budget_name, reminder_amount, reminder_category, reminder_id],
  (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  });
})

app.delete(`/deletereminder/:reminderId`, (req, res) => {
  const id = req.params.reminderId;
  db.query(`DELETE FROM reminders WHERE reminder_id = ?`, [id], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  });
});

app.get(`/getsavings/:id`, (req, res) => {
  const id = req.params.id;
  db.query(`SELECT * FROM savings WHERE user_id = ?`, [id], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  });
})

app.put(`/addtosavings`, (req, res) => {
  const { remaining, id, budget_id } = req.body;

  const updateSql = `UPDATE savings SET savings_amount = savings_amount + ? WHERE savings_name = 'Budget Savings' AND user_id = ?`;
  const deleteSql = `DELETE FROM budget WHERE budget_id = ?`;

  db.query(updateSql, 
  [remaining, id], (Updateerror, Updateresult) => {
    if(Updateerror){
      console.log(Updateerror);
    }
    if(Updateresult){
      db.query(deleteSql, [budget_id], (Deleteerror, Deleteresult) => {
        if(Deleteerror){
          console.log(Deleteerror);
        }
      })
      return res.json({result:Updateresult});
    }
  })
})

app.post(`/addsavings`, (req, res) => {
  const { user_id, savings_amount, savings_name } = req.body;
  const sql = `INSERT INTO savings(user_id, savings_amount, savings_name) VALUES (?, ?, ?)`;
  db.query(sql, [user_id, savings_amount, savings_name], (error, result) => {
    if(error){
      console.log(error);
    }
    if(result){
      return res.json({result:result});
    }
  })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});