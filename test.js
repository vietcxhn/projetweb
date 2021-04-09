const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');



// function add(set) {
//   let plants = db.prepare('SELECT * FROM plants').all();
//   let q = {
//     set : [],
//     answer : null
//   };
//   for (let i = 0; i < 4; i++) {
//     while(true){
//       let random = Math.floor(Math.random() * plants.length);
//       if(!q.set.includes(random)){
//         q.set.push(random);
//         break;
//       }
//     }
//   }
//   q.answer = q.set[Math.floor(Math.random() * 4)];
//   set.push(q);
//   return set;
// }

// let set = [];
// for (let i = 0; i < 20; i++) {
//   add(set);
// }

// console.log(Math.random())
// console.log(set)

