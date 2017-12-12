// @flow
import Repo, {squel} from 'menternship-utils-hapi/repos'
import Post from '../../models/Post'
class PostsRepo extends Repo {
}

export default new PostsRepo('posts', Post)