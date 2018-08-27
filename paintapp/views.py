# Create your views here.

import re
import io
import base64
from PIL import Image
import numpy as np

from django.http import HttpResponse
from django.shortcuts import render
from django.template import loader

from keras.models import load_model
from keras.backend import clear_session

from django.views.decorators.csrf import csrf_exempt

@csrf_exempt # TODO CHANGE THIS
def paint(request):
    if request.method == 'GET':
        return render(request, 'paint.html')
    elif request.method == 'POST':

        # img_size = 28, 28
        # image_string = re.search(r'base64,(.*)', request.POST.get('imageBase64', None)).group(1)
        # image_bytes = io.BytesIO(base64.b64decode(image_string))
        # image = Image.open(image_bytes)
        # this part is broken - need to do weights calculations
        # image = image.resize(img_size, Image.LANCZOS)
        # image.save('image.png')

        image_array = request.POST.getlist('imgMtx[]')

        for i, s in enumerate(image_array):
            s = str(s)
            s = s.split(',')
            image_array[i] = s

        # Convert image to numpy array
        image_array = np.array(image_array)

        # Save the image to PNG just to see
        import scipy
        image_array = image_array.astype(float)
        scipy.misc.imsave('image.png', image_array)

        # Interpolate values to [0, 1]
        image_array = np.interp(image_array, (image_array.min(), image_array.max()), (0, 1))

        # Fit the input shape constraint to CNN (1, 1, 28, 28)
        x = np.expand_dims(image_array, axis=0)
        x = np.expand_dims(x, axis=0)

        model = load_model('MNIST_CNN_model.h5')
        preds = model.predict(x)[0]
        clear_session()
        output = np.where(preds == np.max(preds))[0][0]

        return HttpResponse(output)
