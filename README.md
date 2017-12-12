# Welcome to the server-monolith tutorial

In this tutorial we are going to create a simple backend api that allows us to create, edit, and delete blog posts using the hapijs framework and the menternship-utils-hapi package

## Initialize Project

npm install --save menternship-utils-hapi rejoice dotenv

## Initialize src directory

create src directory

## Start hapijs server using rejoice plugin

create src/manifest.js and add the following

```
// @flow

module.exports = {
  connections: [
    {
      port: '$env.PORT',
    },
  ],
};
```

then add the following to package.json

```
package.json
...,
"scripts": {
  ...,
  "start-dev-server": "NODE_ENV=development node -r dotenv/config -r babel-core/register node_modules/.bin/rejoice -p ./ -c ./src/manifest.js",
}
```
Here we're introducing the start dev script. 
First, we are defining a ENV variable NODE_ENV.
Then we call the node command and immediately require dotenv/config (-r is require). Here we're using the dotenv package to assign ENV variables that are defined in a .env file at the root of the project.
We're also going to require babel-core/register, which is going to compile our js code on the fly down to a version compatible with node 6 (The minimum requirements for this project).
Then, we call the rejoice binary command, which is a package that helps spin up a hapi server from a simple manifest.js configuration file. The -p tells us the root directory to start the project, and the -c tells rejoice where the manifest file is with respect to the root just defined by -p.

Finally, we'll create the .env file in root and add this to it

```
PORT=8080
```

And we'll run our new script

```
npm run start-dev-server
```
If you go to localhost:8080 you should get 404 error. This is what we're looking for. We've just started a server that does absolutely nothing.

## Adding some routes

We're going to add some basic restful end points for posts. First we need to modify the manifest.js file.

```
module.exports = {
  connections: [
    {
      port: '$env.PORT',
    },
  ],
  registrations: [
    {
      plugin: {
        register: `${__dirname}/index.js`,
      },
    },
  ],
};
```

Here we're telling rejoice that we'd like to load a plugin from the root directory. We'll create that file now

src/index.js

```
// @flow
import pkg from '../package.json'

console.log('5 is alive')

const addRoutes = (routes, server)=>routes.forEach(route => server.route(route));
const register = (server, option, ready)=>{
  addRoutes([], server)
  ready()
}
register.attributes = {
  pkg
}

module.exports = register;
```

If we start the server again, we should now see 5 is alive, and since we haven't added any routes yet, the server stil doesn't do anything. Lets add some basic route.

src/controllers/posts/index.js

```
// @flow
import joi from 'joi'
import * as services from '../../services/posts'

export const create = {
  method: 'POST',
  path: '/posts',
  handler: (req, res)=>{
    return services.create(req.payload.content).then(()=>{
      res('success')
    })
    .catch(console.log)
  },
  config: {
    auth: false,
    validate: {
      payload: joi.object().keys({
        content: joi.string().required(),
      })
    }
  }
}

export default [create]
```

src/controllers/posts/index.js
```
// @flow
export const create = (content)=>{
  return Promise.resolve()
}
```

And we're going to register these routes with main plugin

src/index.js
```
...
import posts from 'controllers/posts'

console.log('5 is alive')
const addRoutes = (routes, server)=>routes.forEach(route => server.route(route));

const register = (server, option, ready)=>{
  addRoutes([...posts], server)
  ready()
}
...
```
Now lets start the server. Everything should be running smoothly, but we can't actually test this very easily because we need to make post request to localhost:8080/posts to see if its working. We're going to add a couple of packages to make this easier, most notably the hapi-swagger package. Instead of adding it in manually though, we're going to use the getRegister plugin that menternship-utils-hapi provides, so we'll do some reaaranging the the src/index.js file

src/index.js
```
// @flow
import getRegister from 'menternship-utils-hapi/server';
import posts from './controllers/posts'

console.log('5 is alive')
const register = getRegister([...posts])

module.exports = register;
```
Now lets start up the file, and access the new swagger endpoint localhost:8080/documentation. We should see the new posts end point, and if we try it out, we'll get our success message.

Before we finish, we're going to change the posts controller to use another menternship-utils-hapi function.

src/controllers/posts/index.js

```
// @flow
import joi from 'joi'
import controller from 'menternship-utils-hapi/controllers'
import * as services from '../../services/posts'

export const create = {
  method: 'POST',
  path: '',
  handler: (req, res)=>{
    return services.create(req.payload.content)
    .then(()=>{
      res('success')
    })
    .catch(console.log)
  },
  config: {
    auth: false,
    validate: {
      payload: {
        content: joi.string().required(),
      }
    }
  }
}

export default controller('posts',[create])
```

The controller plugin does four things. It prefixes the path with the first argument, in this case, 'posts', it allows us to pass a basic object to validate.payload instead of a joi.object, it automatically passes in the tag 'api' into the tags config, and it always returns the object {data: result}.

## Adding database

So lets go ahead and npm install node-pg-migrate . At the same time, lets create a new database, and modify the .env file with the appropriate datatabase url 

.env

```
...
DATABASE_URL=postgres://yourname@localhost/yourdatabase (should look something like this, although you may need to add yourname:password@localhost)
```

Once the database is up and running, we're going to add another script to package.json to make running migrations a little easier.

package.json
```
...
  "scripts": {
    "migrate": "node-pg-migrate",
    ...
```

And we'll create our first migration by running npm run migrate -- create add_posts_table

We'll make this a very simple table, with just an id, and a content string column, and create and update date columns

migrations/(whatever file was just created)

```
exports.up = (pgm) => {
  pgm.createTable('posts', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    content: {
      type: 'string',
    },
    created_at: {
      type: 'date',
    },
    updated_at: {
      type: 'date',
    },
  });
};
```
And we'll run the migrations with npm run migrate up

Next, we're going to add a post repository file

src/repositories/posts/index.js

```
// @flow
import pg from 'pg-promise'
import presquel from 'squel'

const squel = presquel.useFlavour('postgres')

class PostsRepo {
  constructor(){
    this.db = pg()(process.env.DATABASE_URL)
  }
  insert = (props)=>{
    const query = squel.insert()
    .into('posts')
    .set('content', props.content)
    .set('created_at', squel.str('NOW()'))
    .set('updated_at', squel.str('NOW()'))
    const {text, values} = query.toParam();
    return this.db.none(text, values)
  }
}

export default new PostsRepo()
```

And now we're going to call this function in services

src/services/posts/index.js

import repo from '../../repositories/posts'

export const create = (content)=>{
  return repo.insert({content})
}

Ok, we're all set to restart the server npm run start-dev-server , and if we hit up the post end point we should see a success, and if we hit up the database, we should see a new entry in the posts table