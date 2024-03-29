const {admin} = require('./admin');
module.exports =  (req,res,next)=>{
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
      idToken = req.headers.authorization.split('Bearer ')[1];
    }
    else{
      console.error("No token found");
      return res.status(403).json({error:'Unauthorized'})
    }
    admin.auth().verifyIdToken(idToken).then(decodedToken=>{
      req.user = decodedToken;
     return admin.firestore().collection('users').where('userId','==',req.user.uid)
      .limit(1).get();
     
    })
    .then((value)=>{
    req.user.handle = value.docs[0].data().handle;
    
    req.user.imageURL = value.docs[0].data().imageURL;
    
    return next();
    })
    .catch(err=>{
      console.error('Error while verfying token',err);
      return res.status(403).json({err});
  
    })
  }
  