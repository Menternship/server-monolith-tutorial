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
    tags: ['api'],
    auth: false,
    validate: {
      payload: {
        content: joi.string().required(),
      }
    }
  }
}

export default controller('posts',[create])