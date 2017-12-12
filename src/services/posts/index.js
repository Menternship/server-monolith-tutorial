// @flow
import repo from '../../repositories/posts'

export const create = (content)=>{
  return repo.insert({content})
}