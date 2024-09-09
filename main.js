const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express();
const PORT = 4000;

// Mongodb 연결 URI     
const uri = 'mongodb://localhost:5001';
const client = new MongoClient(uri);

//데이터베이스 이름
const dbName = 'todolist';

// CORS 미들웨어 설정
app.use(cors());
app.use(express.json());

async function connectToDb() {
  await client.connect();
  console.log('Connected to MongoDB');
  return client.db(dbName); 
}

// 모든 Todo 가져오기
app.get('/todos', async (req, res) => {
  const db = await connectToDb();
  const todos = await db.collection('todos').find().toArray();
  res.json(todos);
});

// 새로운 Todo 추가
app.post('/todos', async (req, res)=> {
  const db = await connectToDb();
  const newTodo = {
    task: req.body.task,
    completed: false  
  };
  const result = await db.collection('todos').insertOne(newTodo);
  res.json({ _id: result.insertedId, task: newTodo.task, completed: newTodo.completed });
});

// Todo 삭제
app.delete('/todos/:id', async (req, res) => {
  const db = await connectToDb ();
  const { id } = req.params;
  await db.collection('todos').deleteOne({ _id: new ObjectId(id) });  //진짜로 다지운다음 들어가게 하려고 await씀
  res.json({ message: 'Todo deleted successfully'});
});

// Todo 체크상태 변경 (완료/미완료) - POST 메소드로 변경
app.post('/todos/:id/check', async (req, res) => {   // 'todos'는 포스트 경로
  const db = await connectToDb();
  const { id } = req.params;
  const { completed } = req.body; // completed 상태를 클라이언트에서 전송
  const result = await db.collection('todos').updateOne( { _id: new ObjectId(id) }, { $set: { completed: completed} } );   //'todos'는 디비 콜렉션(파일)이름 //db안에 {}는 선택자라고 부르는데 업데이트 할때 여기선 선택자 {id}랑{set} 2개 들어감

  res.json({ message: 'Todo status updated successfully', modifiedCount: result.modifiedCount });  // 몇개를 업데이트 했느냐(체크용)를 모디파이드카운트로..
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// 몽고디비 열면 todolist디렉토리같은 거 생겼을거고 그안에 db 3개가 들어가 있어야 한다. (task 3개)
async function addDummyDataIfEmpty() {
  const db = await connectToDb();
  const todoCollection = db.collection('todos');

  const todoCount = await todoCollection.countDocuments();
  
  if (todoCount === 0 ) {
    const dummyTodos = [
      { task: 'Buy groceries', completed: false },
      { task: 'Walk the dog', completed: false },
      { task: 'Read a book', completed: false }
    ];

    await todoCollection.insertMany(dummyTodos);
    console.log('Dummy todos inserted');      
  } else {
    console.log('Todos already exist, skipping dummy data insertion');
  }
}

addDummyDataIfEmpty();