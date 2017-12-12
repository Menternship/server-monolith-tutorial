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