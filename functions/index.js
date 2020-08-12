const functions = require('firebase-functions');
const express = require('express');
const app = express();
var admin = require("firebase-admin");
const firebase = require('firebase');


//TODo :- notisication are not being triggerg come back to it when finisheds
const {getAllScreams} = require('./handlers/scream')
const {
    postOneScream,
    getScream,
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream
}   = require('./handlers/scream') //firbase has 4mb per documrnt limit..thats why we spread out all the data across differnt 
const {signup} = require('./handlers/user')
const {login} = require('./handlers/user')
const {uploadImage} = require('./handlers/user')
const {addUserDetails} = require('./handlers/user')
const {authenticatedUser} = require('./handlers/user')
const FBAuth = require('./util/FBAuth');
const { authDomain } = require('./util/config');
//Screams route
app.get('/screams',getAllScreams);
app.post('/screams',FBAuth,postOneScream);
app.get('/scream/:screamId',getScream);
app.post('/scream/:screamId/comment',FBAuth,commentOnScream);
app.get('/scream/:screamId/like',FBAuth,likeScream);
app.get('/scream/:screamId/unlike',FBAuth,unlikeScream);
app.delete('/scream/:screamId',FBAuth,deleteScream);
//users route
app.post('/signUp',signup);
app.post('/login',login); 
app.post('/user/image',FBAuth,uploadImage);
app.post('/user',FBAuth,addUserDetails);
app.get('/user',FBAuth,authenticatedUser)


exports.notificationOnLike = functions.firestore.document('likes/{id}').onCreate((snapshot)=>{
    admin.firestore().doc(`/screams/${snapshot.data().screamId}`).get()
    .then(doc=>{
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
            return admin.firestore().doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString,
                recipient:doc.data().userHandle,
                sende: snapshot.data().userHandle,
                type: 'like',
                read : false,
                screamId : doc.id

            })
        }
    })
    
    .catch(err=>{
        console.error(err);
     })
});
exports.deletenotificationOnUnlike = functions.firestore.document('likes/{id}').onDelete((snapshot)=>{
    return admin.firestore().doc(`/notifications/${snapshot.id}`).delete()
    
    .catch(err=>{
        console.error(err);
        return 0;
    })
})
exports.notificationOnComment = functions.firestore.document('comments/{id}').onCreate((snapshot)=>{
    return admin.firestore().doc(`/screams/${snapshot.data().screamId}`).get()
    .then(doc=>{
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
            return admin.firestore().doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString,
                recipient:doc.data().userHandle,
                sende: snapshot.data().userHandle,
                type: 'comment',
                read : false,
                screamId : doc.id

            })
        }
    })
    
    .catch(err=>{
        console.error(err);
        return;
    })
});
exports.onUserImageChange = functions.firestore.document('/users/{userId}').onUpdate(change=>{
    console.log(change.before.data());
    console.log(change.after.data());
    if(change.before.data().imageURL!==change.after.data().imageURL  )
    {
        let batch = admin.firestore().batch();
    
        return admin.firestore().collection('screams').where('userHandle','==',change.before.data().handle).get()
    .then(data=>{
        data.forEach( (doc)=>{
            const scream = admin.firestore().doc(`/screams/${doc.id}`)
            .batch.update(scream,{userImage:change.after.data().imageURL })
        })
        return batch.commit();
    })
    }
    
})


exports.onScreamDelete = functions.firestore.document('/screams/{screamId}').onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = admin.firestore().batch();
    return db
      .collection('comments')
      .where('screamId', '==', screamId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return admin.firestore()
          .collection('likes')
          .where('screamId', '==', screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return admin.firestore()
          .collection('notifications')
          .where('screamId', '==', screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(admin.firestore().doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });

//signup route

exports.api = functions.https.onRequest(app)