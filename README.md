# Handwritten Digit Classifier Web App

This web application demonstrates an implementation of a convolutional neural network to classify/recognize a hand-drawn digit.

Inspired by [learning about convolution neural networks using Keras](https://machinelearningmastery.com/handwritten-digit-recognition-using-convolutional-neural-networks-python-keras/).

## Running Locally

Make sure you have Python [installed properly](http://install.python-guide.org). Also, install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and [Postgres](https://devcenter.heroku.com/articles/heroku-postgresql#local-setup).

```sh
$ git clone https://github.com/r2dtu/digit-classifier.git
$ cd digit-classifier

$ pipenv install

$ python manage.py migrate
$ python manage.py collectstatic

$ heroku local
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku

```sh
$ heroku create
$ git push heroku master

$ heroku run python manage.py migrate
$ heroku open
```
or

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Documentation

For more information about using Python on Heroku, see these Dev Center articles:

- [Python on Heroku](https://devcenter.heroku.com/categories/python)
