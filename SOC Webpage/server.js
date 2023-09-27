//Tools require for construction of building
const express=require('express');
const app=express();
const dotenv=require('dotenv');
const path=require('path'); //Inbuilt package

// parse request to body parser
const bodyparser=require('body-parser')
app.use(bodyparser.urlencoded({extended: true}))

const { initializeApp,cert} = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');
var serviceAccount = require("./key.json");
initializeApp({
  credential: cert(serviceAccount),
  ignoreUndefinedProperties: true
});
const db = getFirestore();  

//password hashing 
const bcrypt= require('bcrypt'); 


//set view engine
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));//dynamic changes in html  

app.use(express.static(path.join(__dirname,'assets')));

app.get('/',(req,res)=>{
    const alertMessage=req.query.alertMessage;
    res.render('food',{alertMessage});
})

app.get('/signup',(req,res)=>{
    const alertMessage=req.query.alertMessage;
    res.render('signup',{alertMessage})
}) 

app.get('/about',(req,res)=>{
    const alertMessage=req.query.alertMessage;
    res.render('about',{alertMessage})
})  

app.get('/contact',(req,res)=>{
    const alertMessage=req.query.alertMessage;
    res.render('contact',{alertMessage})
}) 

app.get('/order',(req,res)=>{
    const alertMessage=req.query.alertMessage;
    res.render('order',{alertMessage})
}) 







app.post('/signupsubmit',async (req,res)=>{
    try{
    const newUser = {
        username: req.body.name,
        email: req.body.email,
        password: await bcrypt.hash(req.body.password ,10)
    };

    const userRef = db.collection('users');
    const namequery= await userRef.where('username', '==', newUser.username).get();                             
    if(!namequery.empty){
        const alertMessage = 'Username already exists';
        return res.redirect(`/signup?alertMessage=${encodeURIComponent(alertMessage)}`);
    } 
    const emailquery = await userRef.where('email', '==', newUser.email).get();                             
    if(!emailquery.empty){
        const alertMessage = 'EmailId already exists';
        return res.redirect(`/signup?alertMessage=${encodeURIComponent(alertMessage)}`);
    } 
    await userRef.add(newUser);
    const alertMessage = 'User Registered Successfully';
    return res.redirect(`/login?alertMessage=${encodeURIComponent(alertMessage)}`);

    }   
    catch{
        const alertMessage = 'An error occurred during registration. Please try again later.';
        return res.redirect(`/signup?alertMessage=${encodeURIComponent(alertMessage)}`);
    }                    
})

app.get('/login',(req,res)=>{
    const alertMessage=req.query.alertMessage;
    res.render('login',{alertMessage})
})


app.post('/loginsubmit',async (req,res)=>{
    try{
    const info=db.collection('users');
    const snapshot=await info.where('email','==',req.body.email).get();
    if(snapshot.empty){
        const alertMessage='Email not registered please create an acccount';
        return res.redirect(`/login?alertMessage=${encodeURIComponent(alertMessage)}`);
    }
    else{
        const userdoc=snapshot.docs[0];
        const storedpassword=userdoc.data().password; 
        const isPasswordCorrect = await bcrypt.compare(req.body.password,storedpassword); 

        if(isPasswordCorrect){
            const alertMessage='Login successfully'
            const email=req.body.email
            return res.render('order', { alertMessage, useremail: email ,totalamount:0});
        }
        else{
            const alertMessage='Password and Email-Id mismatched please verify';
            return res.redirect(`/login?alertMessage=${encodeURIComponent(alertMessage)}`);
        } 
    }
    }
    catch (error) {
        console.error('Error during login:', error);
        const alertMessage = 'An error occurred during login. Please try again later.';
        return res.redirect(`/login?alertMessage=${encodeURIComponent(alertMessage)}`);
    }
})

app.get('/order', (req, res) => {
    const useremail = req.query.email;
    res.render('order', { useremail: useremail }); // Pass useremail as a variable to the template
});



 // Create a Firestore collection called 'costs'

app.get("/addedToCart", (req, res) => {
    const val = req.query.item;
    const user=req.query.email
    const cost = parseFloat(req.query.cost); // Parse the cost as a float
    const userinf=db.collection('users').doc(user)
    const costsCollection = userinf.collection('costs');
    
    let totalamount = parseInt(req.query.totalamount) || 0;

    // Add the data to Firestore
    costsCollection.add({
        item: val,
        cost: cost,
    })
    .then((docRef) => {
        console.log("Document written with ID: ", docRef.id); 
        totalamount += cost;
        res.render("order", {useremail:user, totalamount});
    })
    .catch((error) => {
        console.error("Error adding document: ", error);
    });
   

});

//port initializtion
dotenv.config({path:'config.env'})
const port=process.env.PORT||3000;
app.listen(port, () => {
    console.log(`The server is running on: http://localhost:${port}`);
}); 



