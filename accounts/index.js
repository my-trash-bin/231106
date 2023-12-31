const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");

const { accounts } = require("../data");
const jwt = require("jsonwebtoken");

const port = 4001;

const typeDefs = gql`
  type Account @key(fields: "id") {
    id: ID!
    name: String
  }
  extend type Query {
    account(id: ID!): Account
    accounts: [Account]
    viewer: Account!
  }
  extend type Mutation {
    login(email: String!, password: String!): String
  }
`;

const resolvers = {
  Account: {
    _resolveReference(object) {
      return accounts.find(account => account.id === object.id);
    }
  },
  Query: {
    account(parent, { id }) {
      return accounts.find(account => account.id === id);
    },
    accounts() {
      return accounts;
    },
    viewer(parent, args, { user }) {
      return accounts.find(account => account.id === user.sub);
    }
  },
  Mutation: {
    login(parent, { email, password }) {
      const { id, permissions, roles } = accounts.find(
        account => account.email === email && account.password === password
      );
      return jwt.sign(
        { "https://awesomeapi.com/graphql": { roles, permissions } },
        "f1BtnWgD3VKY",
        { algorithm: "HS256", subject: id, expiresIn: "1d" }
      );
    }
  },
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
  context: ({ req }) => {
    const user = req.headers.user ? JSON.parse(req.headers.user) : null;
    console.log({user});
    return { user };
  }
});

server.listen({ port }).then(({ url }) => {
  console.log(`Accounts service ready at ${url}`);
});
