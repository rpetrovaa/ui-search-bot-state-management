import { Routes, RouterModule } from '@angular/router';
import { InstructionsComponent } from './instructions/instructions.component';
import { UISearchChatbotComponent } from './ui-search-chatbot/ui-search-chatbot.component';

const routes: Routes = [
  { path: '', component: UISearchChatbotComponent },
  // { path: 'instructions', component: InstructionsComponent },

  // otherwise redirect to home
  { path: '**', redirectTo: '' },
];

export const AppRoutingModule = RouterModule.forRoot(routes);
