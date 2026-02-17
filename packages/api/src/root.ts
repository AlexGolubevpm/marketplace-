import { router } from "./trpc";
import { customersRouter } from "./routers/customers";
import { carriersRouter } from "./routers/carriers";
import { requestsRouter } from "./routers/requests";
import { offersRouter } from "./routers/offers";
import { ordersRouter } from "./routers/orders";
import { analyticsRouter } from "./routers/analytics";
import { settingsRouter } from "./routers/settings";
import { contentRouter } from "./routers/content";
import { knowledgebaseRouter } from "./routers/knowledgebase";
import { knowledgeRouter } from "./routers/knowledge";

export const appRouter = router({
  customers: customersRouter,
  carriers: carriersRouter,
  requests: requestsRouter,
  offers: offersRouter,
  orders: ordersRouter,
  analytics: analyticsRouter,
  settings: settingsRouter,
  content: contentRouter,
  knowledgebase: knowledgebaseRouter,
  knowledge: knowledgeRouter,
});

export type AppRouter = typeof appRouter;
