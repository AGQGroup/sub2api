import landing from './landing'
import common from './common'
import dashboard from './dashboard'
import admin from './admin'
import misc from './misc'
import getoneapi from './getoneapi'

export default {
  ...landing,
  ...common,
  ...dashboard,
  ...getoneapi,
  admin,
  ...misc,
}
