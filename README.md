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
  /*
  registrations: [
    {
      plugin: {
        register: __dirname,
      },
    },
  ],
  */
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

## Add the remaining end points

We're going to add the remaining end points now for updating, deleting, retrieving all of the posts, and retrieving a single post

src/controllers/posts/index.js

```
...
export const create = {
  method: 'POST',
  path: '',
  handler: (req, res)=>{
    return services.create(req.payload.content).then(()=>{
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

export const update = {
  method: 'PATCH',
  path: '/{id}',
  handler: (req, res)=>{
    return services.update(req.params.id, req.payload.content).then(()=>{
      res('success')
    })
    .catch(res)
  },
  config: {
    auth: false,
    validate: {
      payload: {
        content: joi.string().required(),
      },
      params: {
        id: joi.number().required(),
      }
    }
  }
}

export const remove = {
  method: 'DELETE',
  path: '/{id}',
  handler: (req, res)=>{
    return services.remove(req.params.id).then(()=>{
      res('success')
    })
    .catch(res)
  },
  config: {
    auth: false,
    validate: {
      params: {
        id: joi.number().required(),
      }
    }
  }
}

export const get = {
  method: 'GET',
  path: '/{id}',
  handler: (req, res)=>{
    return services.get(req.params.id).then((post)=>{
      res(post)
    })
    .catch(res)
  },
  config: {
    auth: false,
    validate: {
      params: {
        id: joi.number().required(),
      }
    }
  }
}

export const index = {
  method: 'GET',
  path: '',
  handler: (req, res)=>{
    return services.index().then((posts)=>{
      res(posts)
    })
    .catch(res)
  },
  config: {
    auth: false,
  }
}

export default controller('posts',[create, update, remove, get, index])
```

src/services/posts/index.js
```
...
export const update = (id, content)=>{
  return repo.update({id}, {content})
}

export const remove = (id)=>{
  return repo.remove({id})
}

export const get = (id)=>{
  return repo.retrieveOne({id})
}

export const index = ()=>{
  return repo.retrieveAll({})
}
```

src/repositories/posts/index.js
```
...
  update = (attributes, props) => {
    const query = squel.update()
    .table('posts')
    .where('id = ?', attributes.id)
    .set('content', props.content)
    const {text, values} = query.toParam();
    return this.db.none(text, values)
  }
  remove = (attributes) => {
    const query = squel.delete()
    .from('posts')
    .where('id = ?', attributes.id)
    const {text, values} = query.toParam();
    return this.db.none(text, values)
  }
  retrieveOne = (attributes) => {
    const query = squel.select()
    .from('posts')
    .field('*')
    .where('id = ?', attributes.id)
    const {text, values} = query.toParam();
    return this.db.one(text, values)
  }
  retrieveAll = () => {
    const query = squel.select()
    .from('posts')
    .field('*')
    const {text, values} = query.toParam();
    return this.db.manyOrNone(text, values)
  }
}

export default new PostsRepo()
```

If we restart the server, we should have complete restful end points for posts. The last step in this tutorial is to replace the repo we just created with the repo class from menternship-utils-hapi

src/repositories/posts/index.js

```
// @flow
import Repo, {squel} from 'menternship-utils-hapi'

class PostsRepo extends Repo {
}

export default new PostsRepo('posts')
```

Basically, this is to show you generally functionality that the Repo class provides. insert, update, remove, retrieveOne, retrieveAll. Basically, when you provide these functions with an object, it takes the key of that object uses it with the value in either a set statement or a where statement. For the update function, the first argument is the object of where statements, and the second is the object of set statements. All of these functions will convert the keys from camelcase to snakecase so that we don't need to mix snakecase and camelcase.

The insert function by default always returns the id of the created row.

The retrieve functions (retrieveOne, retrieveAll, retrieve) will always return camelcase objects back.

The last thing we're going to do in this tutorial is only return the id and the content of the posts, and we're going to do this by including a model in the repo class.

src/models/Post/index.js

```
// @flow
export default class Post {
  constructor(props){
    this.content = props.content
    this.id = props.id
  }
}
```

src/repositories/posts/index.js

```
// @flow
import Repo, {squel} from 'menternship-utils-hapi/repos'
import Post from '../../models/Post'
class PostsRepo extends Repo {
}

export default new PostsRepo('posts', Post)
```

Now go ahead and restart the server and check out the GET method requests, and they should only return id and content.

That completes the tutorial! Bon Apetite.
