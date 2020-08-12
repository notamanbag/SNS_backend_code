const {db,admin }= require('../util/admin')
exports.getAllScreams = (req,res)=>{
  
    db.firestore().collection('scream').orderBy('createdAt','desc').get()
    .then((data) =>{
      let screams =[];
      data.forEach((doc)=>{
        screams.push({
          screamId:doc.id,
          body:doc.data().body,
          userHandle:doc.data().userHandle,
          createdAt:doc.data().createdAt,
          commentCount:doc.data().commentCount,
          likeCount :doc.data().likeCount,
          userImage : doc.data().userImage
        });
  
      });
      return res.json(screams);
    })
    .catch((err)=>console.error(err));
    
  }

exports.postOneScream = (req,res)=>{
  
    const newScream ={
      body: req.body.body,
      userHandle: req.user.handle,
      createdAt : new Date().toISOString(),
      userImage:req.user.imageURL,
      likeCount :1,
      commentCount :0
    };
    db.firestore()
    .collection('scream')
    .add(newScream)
    .then((doc)=>{
      const resScream = newScream;
      resScream.screamId = doc.id;

      res.json(resScream);
    })
    .catch((err)=>{
      res.status(500).json({error:'something went wrong'});
      console.error(err);
    });
  }
//Fetch comments on the scream
exports.getScream =(req,res)=>{

    let screamData = {};
    admin.firestore().doc(`/scream/${req.params.screamId}`).get()
    .then(doc=>{
      
      if(!doc.exists)
      {
        return res.status(400).json({message:"No scream found"});
      }
      screamData = doc.data();
      screamData.screamId =doc.id;
      let id = req.params.screamId;
      console.log(id);
      return db.firestore().collection('comments').orderBy('createdAt','desc').where('screamId','==',req.params.screamId).get();

    })
      .then(data=>{
       
        screamData.comments =[];
        
        data.forEach(doc=>{
         
          screamData.comments.push(doc.data());
        });
          
        return res.json(screamData);
      }) 
      .catch(err=>{
        console.error(err);
        return res.status(500).json({message:err.code}); 
      })
    }
//Comments on scream
exports.commentOnScream=(req,res)=>{
  if(req.body.body.trim()===" ")return res.status(400).json({error:"You dumb bitch...comment must not be empty"});
  const newComment ={
    body :req.body.body,
    createdAt:new Date().toISOString(),
    screamId:req.params.screamId,
    userHandle :req.user.handle,
    userImage:req.user.imageURL
  } ;
  admin.firestore().doc(`/scream/${req.params.screamId}`).get()
  .then(doc=>{
    if(!doc.exists)return res.status(404).json({error:"Scream doesnt exists"});

    return doc.ref.update({commentCount:doc.data().commentCount+1});

  })
  .then(()=>{
    console.log(newComment);
    return admin.firestore().collection('comments').add(newComment);

  })
  .then(()=>{
    return res.json(newComment);
  })
  .catch(err=>{
    console.log(err);
    return res.status(500).json({error:"Something went wrong"});
  })

}
//LIking a scream
exports.likeScream =(req,res)=>{
  const likeDoc = admin.firestore().collection('likes').where('userHandle','==',req.user.handle)
                  .where('screamId','==',req.params.screamId).limit(1); 
  const screamDoc = admin.firestore().doc(`/scream/${req.params.screamId}`);
  let screamData ;
  screamDoc.get().then(doc=>{
    if(doc.exists)
    {
      screamData = doc.data();
      screamData.screamId = doc.id;
      return likeDoc.get();
    }
    else{
      return res.status(404).json({error:"Scream doesnt exists"});
    }
  })
  .then(data=>{
    if(data.empty)
    {
      return admin.firestore().collection('likes').add({
        screamId:req.params.screamId,
        userHandle:req.user.handle
      })
      .then(()=>{
        screamData.likeCount++;
        return screamDoc.update({likeCount :screamData.likeCount })
      })
      .then(()=>{
        return res.json(screamData);
      })
    }
    else{
      return res.status(400).json({er:"Scream already liked"});
    }
  })
  .catch(err=>{
    console.error(err);
    res.status(500).json({err:err.code})
  })
}
exports.unlikeScream =(req,res)=>{
  const likeDoc = admin.firestore().collection('likes').where('userHandle','==',req.user.handle)
  .where('screamId','==',req.params.screamId).limit(1); 
    const screamDoc = admin.firestore().doc(`/scream/${req.params.screamId}`);
    let screamData ;
    screamDoc.get().then(doc=>{
    if(doc.exists)
    {
    screamData = doc.data();
    screamData.screamId = doc.id;
    return likeDoc.get();
    }
    else{
    return res.status(404).json({error:"Scream doesnt exists"});
    }
    })
    .then(data=>{
    if(data.empty)
    {
      return res.status(400).json({er:"Scream already liked"});
    
    }
    else{
      return admin.firestore().doc(`/likes/${data.docs[0].id}`).delete()
        .then(()=>{
        screamData.likeCount--;
        return screamDoc.update({likeCount :screamData.likeCount })
        })
        .then(()=>{
        return res.json(screamData);
        })
    
    }
    })
    .catch(err=>{
    console.error(err);
    res.status(500).json({err:err.code})
    })

}
exports.deleteScream = (req,res)=>{
  const screamData = admin.firestore().doc(`/scream/${req.params.screamId}`);
  screamData.get().then((doc)=>{
    if(!doc.exists)
    {
      return res.status(404).json({err :" Scream doesnt exists"});
    }
    if(doc.data().userHandle !== req.user.handle)
    {
      return res.status(403).json ({err:'Unauthorized'});

    }
    else{
      screamData.delete();
    }
  })
  .then(()=>{
    res.json({msg: 'Scream deleted sucessfully'})
  })
  .catch(err=>{
    console.error(err);
    return res.status(500).json({err:err.code});
  })
}