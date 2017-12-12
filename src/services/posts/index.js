// @flow
import repo from '../../repositories/posts'

export const create = (content)=>{
  return repo.insert({content})
}

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