from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def calculate_similarity(resume_embedding, job_embedding):

    resume_vector = np.array(resume_embedding).reshape(1, -1)
    job_vector = np.array(job_embedding).reshape(1, -1)

    score = cosine_similarity(
        resume_vector,
        job_vector
    )[0][0]

    return score