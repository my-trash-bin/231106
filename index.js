const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");
const { ApolloServer } = require("apollo-server-express");
const express = require("express");
const { expressjwt } = require("express-jwt");

(async () => {

const port = 4000;
const app = express();

app.use(
  expressjwt({
    secret: "f1BtnWgD3VKY",
    algorithms: ["HS256"],
    credentialsRequired: false
  })
);

const gateway = new ApolloGateway({
  serviceList: [{ name: "accounts", url: "http://localhost:4001" }],
  buildService({ name, url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        request.http.headers.set(
          "user",
          context.user ? JSON.stringify(context.user) : null
        );
      }
    });
  }
});

const server = new ApolloServer({
  gateway,
  subscriptions: false,
  context: ({ req }) => {
    const user = req.auth || null;
    return { user };
  }
});

await server.start();

server.applyMiddleware({ app });

app.listen({ port }, () =>
  console.log(`Server ready at http://localhost:${port}${server.graphqlPath}`)
);

})();
