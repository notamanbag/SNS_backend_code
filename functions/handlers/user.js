const  {admin} = require('../util/admin');
const firebase = require('firebase');
const config = require('../util/config')
const {isEmpty} = require('../util/validator');
const {isEmail} = require('../util/validator');
const reduceUserDetails = require('../util/userDetails')
//const {reduceUserDetails} = require('../util/validator');
firebase.initializeApp(config);
const test =  (data) => {
  let userDetails={};
  if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
  if(!isEmpty(data.website.trim())){
    if(data.website.trim().substring(0,4)!== 'http'){
      userDetails.website = `http://${data.website.trim()}`;
    }else{
      userDetails.website = data.website;
    }
  }
  if(!isEmpty(data.location.trim())) userDetails.location = data.location;
  return userDetails;
}

exports.signup = (req,res)=>{
    const newUser = {
      email:req.body.email,
      password:req.body.password,
      confirmPassword:req.body.confirmPassword,
      handle:req.body.handle, 


    };
    //checkinng the input from user
    let errors ={};

    if(isEmpty(newUser.email)){
      errors.email = 'Email must not be empty';
    }else if(!isEmail(newUser.email)){
      errors.email = 'Must be valid email address';
    }
    if(isEmpty(newUser.password)){
      errors.password = 'Must not be empty';
    }
    if(newUser.password!==newUser.confirmPassword)errors.confirmPassword = 'Passord must be the same';
    if(isEmpty(newUser.handle)){
      errors.handle = 'Must not be empty';
    }


    if(Object.keys(errors).length>0) return res.status(400).json(errors);
      //creating newuser and  saving them into the users collections
    const noImg = 'no-img.png';
    let userHandle= newUser.handle;
    let usertoken,userId;
    admin.firestore().doc(`/users/${newUser.handle}`)
    .get().then(doc=>{
      if(doc.exists){
        return res.status(400).json({hande:'This handle is already taken'})
      }
      else{
        return  firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
      }
    }).then(data=>{
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(token=>{
        usertoken = token;
        const userCredentials ={
          handle:newUser.handle,
          email:newUser.email,
          createdAt : new Date().toISOString(),
          imageURL:`https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
          userId,
        }
       return  admin.firestore().doc(`/users/${newUser.handle}`).set(userCredentials);
      
    })
    .then(()=>{
      return res.status(200).json({usertoken});
    })
    .catch(err=>{
      if(err==="auth/email-already-in-use")
      {
        return res.json({error:"Email is alredy in use"});
      }
      else{
        console.error(err);
        return res.status(500).json({genral:'Something wenr wrong.Please try again'});
      }
      
    })
    //TODO:- validate Data
   
}
exports.login = (req,res)=>{
    let errors ={};
    const user ={
      email : req.body.email,
      password: req.body.password,
    }
    if(isEmpty(user.email)) {
      errors.email ="Email must not be empty";
    }
    if(isEmpty(user.password)){
      errors.password ="Password must not be empty";
    }
    if(!isEmail(user.email)){
     errors.email = 'Must be valid email address';
 
    }
    
    if(Object.keys(errors).length>0){
      return res.status(400).json(errors);
    }
    firebase.auth().signInWithEmailAndPassword(user.email,user.password).then(data=>{
      return data.user.getIdToken();
    })
    .then(token=>{
      return res.json({token})
    })
    .catch(err=>{
      if(err.code==="auth/wrong-password")
      {
        return res.status(400).json({error:"Wrong Password/Wrong credentials please try again"});
      }
      console.error(err);
      return res.status(500).json({error:err.code});
    })
 
  }
exports.addUserDetails =(req,res)=>{
    
    let userDetails = test(req.body);
   
    admin.firestore().doc(`/users/${req.user.handle}`).update(userDetails).then(()=>{
      return res.json({message:"Details added succesfully"});
  
    }).catch(err=>{
      console.error(err);
      return res.status().json({error:err.code});
    })
    
  
  }
  //Updating user image from no-img(default) to user sprecidfic
exports.uploadImage = (req,res)=>{
    const Busboy = require('busboy');
    const path = require('path');
    const fs = require('fs');
    const os = require('os');

    let imageName;
    let imageToBeUploaded ={};

    const busboy = new Busboy({headers:req.headers});
    busboy.on('file',(fieldname,file,filename,encoding,mimetype)=>{
        //image.png
        if(mimetype !=='image/jpeg' && mimetype!== 'image/png')
        {
          return res.status(400).json({error:"File not supported"});
        }
        console.log(fieldname);
        console.log(filename);
        console.log(mimetype);
        const imageExtension =  filename.split('.')[filename.split('.').length-1];
        imageName =`${Math.round(Math.random()*10000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(),imageName);
        imageToBeUploaded ={filepath,mimetype};
        file.pipe(fs.createWriteStream(filepath));
    }
    );
    
    busboy.on('finish',()=>{
        admin.storage().bucket().upload(imageToBeUploaded.filepath,{
            resumable:false,
            metadata:{
                metadata:{
                    contentType:imageToBeUploaded.mimetype
                }
            }
        })
    .then(()=>{
        const imageURL = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageName}?alt=media`;
        return admin.firestore().doc(`/users/${req.user.handle}`).update({imageURL});

    })
    .then(()=>{
        return res.json({message:"Image uploaded succesfully"});
    })
    .catch(err=>{
        console.error(err);
        res.status(500).json({error:err.code});
    })
  });
    busboy.end(req.rawBody);


    }
exports.authenticatedUser =(req,res)=>{

  let resData ={};
  admin.firestore().doc(`/users/${req.user.handle}`).get()
  .then(doc=>{
    if(doc.exists){
      resData.credentials = doc.data();
      return admin.firestore().collection('likes').where('userHandle','==',req.user.handle).get()
    }
  }).then(data=>{
    resData.likes =[];
    data.forEach(doc=>{
      resData.likes.push(doc.data());
      })
      return res.json(resData);
  }).catch(err=>{
    console.error(err);
    return res.json(err.code);
  })

}



    //Adding user details
