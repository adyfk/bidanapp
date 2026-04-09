module.exports = {
  apps: [
    {
      name: 'bidanapp-backend',
      cwd: '/srv/bidanapp',
      script: 'npm',
      args: 'run start:backend',
      env_file: '/srv/bidanapp/apps/backend/.env',
    },
    {
      name: 'bidanapp-bidan',
      cwd: '/srv/bidanapp',
      script: 'npm',
      args: 'run start:bidan',
      env_file: '/srv/bidanapp/apps/bidan/.env',
    },
    {
      name: 'bidanapp-admin',
      cwd: '/srv/bidanapp',
      script: 'npm',
      args: 'run start:admin',
      env_file: '/srv/bidanapp/apps/admin/.env',
    },
  ],
};
