# zmvc-server

## Installation

```bash
npm install zmvc-server
```

## Basic Usage

```js
const zmvc = require('zmvc-server');

// instantiate server and get MVC object
const server = new zmvc.ZMVCServer();
const mvc = server.mvc;

// create model with promise-based handler
// should return a promise with data
// data can be an output from database or any other API
mvc.model.add('model1', {
    handler: (req) => {
        return Promise.resolve([
            { info: 'someinfo1' },
            { info: 'someinfo2' },
        ]);
    }
});

// create view with data handler
// should return a array or object of data
// data will be the output of model
mvc.view.add('view1', {
    handler: (data, req) => {
        return data.map(value => {
            return value.info;
        });
    }
})

// create controller with route=/info
// and gather data from model1 and serializer from view1
mvc.controller.get('/info', 'model1', 'view1');

// start server on port 3000
server.listen(3000, (err) => {
    if (err) {
        console.log('Error: ', err);
    } else {
        console.log('Server started on ', 'http://localhost:3000');
    }
});
```