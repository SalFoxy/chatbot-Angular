import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { ChatComponent } from './app/chat/chat.component';
import { appConfig } from './app/app.config';

export default function bootstrap() {
  return bootstrapApplication(ChatComponent, appConfig, context);
}
