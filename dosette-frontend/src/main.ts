import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { provideAuth0 } from '@auth0/auth0-angular';


bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAuth0({
      domain: 'dev-04qtenwwky26c37h.us.auth0.com',
      clientId: '2a6hiI3ZQeNNYRjEO46un08oL5AcNd8i',
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    })
  ]
})
  .catch((err) => console.error(err));
