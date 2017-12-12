// @flow
import joi from 'joi'
import controller from 'menternship-utils-hapi/controllers'
import * as services from '../../services/posts'

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