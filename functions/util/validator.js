const isEmpty = (string)=>{
    if(string.trim()=='')return true;
    else return false;
  }
const isEmail = (email)=>{
    const rex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(rex))return true;
    else return false;
  }
// const reduceUserDetails =(data)=>{
//   let userDetails={};
//   if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
//   if(!isEmpty(data.website.trim())){
//     if(data.website.trim().substring(0,4)!== 'http'){
//       userDetails.website = `http://${data.website.trim()}`;
//     }else{
//       userDetails.website = data.website;
//     }
//   }
//   if(!isEmpty(data.location.trim())) userDetails.location = data.location;
//   return userDetails;
// }
  module.exports ={isEmpty,isEmail};