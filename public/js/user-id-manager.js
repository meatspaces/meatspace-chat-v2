module.exports = UserIdManager;

var LOCAL_STORAGE_KEY = 'usersIds';

function UserIdManager() {
  this.reload();
}

UserIdManager.prototype.add = function(id) {
  if (this.contains(id)) {
    return;
  }

  this.ids.unshift(id);
  this.ids = this.ids.slice(0, 20);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.ids));
};

UserIdManager.prototype.contains = function(id) {
  return this.ids.indexOf(id) > -1;
};

UserIdManager.prototype.reload = function() {
  this.ids = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
}
