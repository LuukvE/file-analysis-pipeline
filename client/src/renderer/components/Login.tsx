import Button from './Button';

export default () => {
  return (
    <div className="flex pt-8 flex-wrap justify-start pb-8 gap-x-4 items-center grow">
      <Button href="http://localhost:8080/v1/google/init">Sign in</Button>
    </div>
  );
};
