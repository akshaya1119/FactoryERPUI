import React from 'react'
import ServerError from "./../assets/images/serverError.svg";

const ErrorPage = () => {
  return (
    <div>
      <div className="container text-center align-items-center mt-3 rounded-4 shadow-lg">
        <div className="row justify-content-center align-items-center">
          <div className="col-12 col-md-8 col-lg-6">
            <img
              src={ServerError}
              alt="404 Not Found"
              className="img-fluid mb-3  w-75 container"
            />
            <h2 className="mb-0 pb-5 poppins-semibold">PAGE NOT FOUND</h2>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage
