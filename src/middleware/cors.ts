import configs from "../configs";

const corsOptions = {
  origin: configs.clientUrl,
  credentials: true, // Request includes credentials like cookies
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
};

console.log('corsOption:::', corsOptions)

export default corsOptions;