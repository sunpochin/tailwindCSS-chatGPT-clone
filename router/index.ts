import { createRouter, createWebHistory } from 'vue-router';
import ChatLayout from '~/components/ChatLayout.vue';

const routes = [
  {
    path: '/',
    component: ChatLayout,
    name: 'home'
  },
  {
    path: '/chat/:id',
    component: ChatLayout,
    name: 'chat'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
