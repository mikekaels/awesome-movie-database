const chai = require('chai')
const chaiHttp = require('chai-http')
const {
    expect
} = chai
chai.use(chaiHttp)
const server = require('../server.js')

const User = require('../models/user.js')
const userFixtures = require('../fixtures/userFixture.js')
const staticUser = userFixtures.create()
const staticUser2 = userFixtures.create()
const staticAdmin = userFixtures.create()

const Movie = require('../models/movie.js')
const movieFixtures = require('../fixtures/movieFixture.js')
const staticMovie = movieFixtures.create()

const Review = require('../models/review.js')
const reviewFixtures = require('../fixtures/reviewFixture.js')
const staticReview = reviewFixtures.create()

describe('REVIEW API TESTING', () => {
    before(function () {
        staticAdmin.password_confirmation = staticAdmin.password
        User.registerAdmin(staticAdmin)

        staticUser.password_confirmation = staticUser.password
        chai.request(server)
            .post('/api/v1/users')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .end(() => { })

        staticUser2.password_confirmation = staticUser2.password
        chai.request(server)
            .post('/api/v1/users')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser2))
            .end(() => { })

        chai.request(server)
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .end((err, res) => {
                let token = res.body.data.token
                chai.request(server)
                    .post('/api/v1/movies')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(staticMovie))
                    .end((err, res) => {
                    })

            })
    })

    context('POST /api/v1/reviews', () => {
        it('Should add new review', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticUser))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                            let movieId = res.body.data.docs[i]._id
                            let reviewSample = reviewFixtures.create()
                            chai.request(server)
                                .post('/api/v1/reviews')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ movieId: movieId })
                                .send(JSON.stringify(reviewSample))
                                .end((err, res) => {
                                    expect(res.status).to.equal(201)
                                    let { success, data } = res.body
                                    expect(success).to.eq(true)
                                    expect(data).to.be.an('object')
                                })
                        })
                })
        })

        it('Should not add new review due previously created preview', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    let movieSample = movieFixtures.create()
                    chai.request(server)
                        .post('/api/v1/movies')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .send(JSON.stringify(movieSample))
                        .end((err, res) => {
                            let movieId = res.body.data._id
                            chai.request(server)
                                .post('/api/v1/auth')
                                .set('Content-Type', 'application/json')
                                .send(JSON.stringify(staticUser))
                                .end((err, res) => {
                                    token = res.body.data.token
                                    chai.request(server)
                                        .post('/api/v1/reviews')
                                        .set('Content-Type', 'application/json')
                                        .set('Authorization', token)
                                        .query({ movieId: movieId })
                                        .send(JSON.stringify(staticReview))
                                        .end((err, res) => {
                                            chai.request(server)
                                                .post('/api/v1/reviews')
                                                .set('Content-Type', 'application/json')
                                                .set('Authorization', token)
                                                .query({ movieId: movieId })
                                                .send(JSON.stringify(staticReview))
                                                .end((err, res) => {
                                                    expect(res.status).to.equal(422)
                                                    let { success, error } = res.body
                                                    expect(success).to.eq(false)
                                                    expect(error).to.eq("You've already created a review for this movie")
                                                })
                                        })
                                })
                        })
                })
        })
    })

    context('GET /api/v1/reviews', () => {
        it('Should show all review from one specific user', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticUser))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/reviews')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                            let page = Math.ceil(Math.random() * (lastPage))
                            chai.request(server)
                                .get('/api/v1/reviews')
                                .set('Authorization', token)
                                .query({ page: page })
                                .end((err, res) => {
                                    expect(res.status).to.equal(200)
                                    let { success, data } = res.body
                                    expect(success).to.eq(true)
                                    expect(data).to.be.an('object')
                                })
                        })
                })
        })

        it('Should show first page of all review from one specific user due to invalid page', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticUser))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/reviews')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                            let page = lastPage + 1
                            chai.request(server)
                                .get('/api/v1/reviews')
                                .set('Authorization', token)
                                .query({ page: page })
                                .end((err, res) => {
                                    expect(res.status).to.equal(200)
                                    let { success, data } = res.body
                                    expect(success).to.eq(true)
                                    expect(data).to.be.an('object')
                                })
                        })
                })
        })
    })

    context('GET /api/v1/reviews/movie', () => {
        it('Should show all review from one specific movie', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticUser))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                            let movieId = res.body.data.docs[i].movieId
                            let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                            let page = Math.ceil(Math.random() * (lastPage))
                            chai.request(server)
                                .get('/api/v1/reviews/movie')
                                .set('Authorization', token)
                                .query({ movieId: movieId, page: page })
                                .end((err, res) => {
                                    expect(res.status).to.equal(200)
                                    let { success, data } = res.body
                                    expect(success).to.eq(true)
                                    expect(data).to.be.an('object')
                                })
                        })
                })
        })

        it('Should show first page of all review from one specific movie', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticUser))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                            let movieId = res.body.data.docs[i].movieId
                            let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                            let page = lastPage + 1
                            chai.request(server)
                                .get('/api/v1/reviews/movie')
                                .set('Authorization', token)
                                .query({ movieId: movieId, page: page })
                                .end((err, res) => {
                                    expect(res.status).to.equal(200)
                                    let { success, data } = res.body
                                    expect(success).to.eq(true)
                                    expect(data).to.be.an('object')
                                })
                        })
                })
        })
    })

    context('PUT /api/v1/reviews', () => {
        it('Should update a review from a user', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticUser))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/reviews')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                            let reviewId = res.body.data.docs[i]._id
                            let reviewSample = reviewFixtures.create()
                            delete reviewSample.rating
                            chai.request(server)
                                .put('/api/v1/reviews')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ reviewId: reviewId })
                                .send(JSON.stringify(reviewSample))
                                .end((err, res) => {
                                    expect(res.status).to.equal(201)
                                    let { success, data } = res.body
                                    expect(success).to.eq(true)
                                })
                        })
                })
        })

        it('Should not update a review due to invalid reviewId', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticUser))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/reviews')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let reviewId = 'reviewId'
                            let reviewSample = reviewFixtures.create()
                            delete reviewSample.rating
                            chai.request(server)
                                .put('/api/v1/reviews')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ reviewId: reviewId })
                                .send(JSON.stringify(reviewSample))
                                .end((err, res) => {
                                    expect(res.status).to.equal(422)
                                    let { success, error } = res.body
                                    expect(success).to.eq(false)
                                    expect(error.message).to.eq('Cast to ObjectId failed for value "reviewId" at path "_id" for model "Review"')
                                })
                        })
                })
        })
    })

    // context('DELETE /api/v1/reviews', () => {
    //     it('Should delete a review', () => {
    //         chai.request(server)
    //             .get('/api/v1/movies/title')
    //             .query({ title: staticMovie.title })
    //             .end((err, res) => {
    //                 let movieId = res.body.data._id
    //                 chai.request(server)
    //                     .post('/api/v1/auth')
    //                     .set('Content-Type', 'application/json')
    //                     .send(JSON.stringify(staticUser))
    //                     .end((err, res) => {
    //                         let token = res.body.data.token
    //                         let reviewSample = reviewFixtures.create()
    //                         chai.request(server)
    //                             .post('/api/v1/reviews')
    //                             .set('Content-Type', 'application/json')
    //                             .set('Authorization', token)
    //                             .query({ movieId: movieId })
    //                             .send(JSON.stringify(reviewSample))
    //                             .end((err, res) => {
    //                                 let reviewId = res.body.data._id
    //                                 chai.request(server)
    //                                     .delete('/api/v1/reviews')
    //                                     .set('Authorization', token)
    //                                     .query({ reviewId: reviewId })
    //                                     .end((err, res) => {
    //                                         expect(res.status).to.equal(200)
    //                                         let { success, data } = res.body
    //                                         expect(success).to.eq(true)
    //                                     })
    //                             })
    //                     })

    //             })
    //     })

    //     it('Should delete a review v2', () => {
    //         chai.request(server)
    //             .get('/api/v1/movies/title')
    //             .query({ title: staticMovie.title })
    //             .end((err, res) => {
    //                 let movieId = res.body.data._id
    //                 chai.request(server)
    //                     .post('/api/v1/auth')
    //                     .set('Content-Type', 'application/json')
    //                     .send(JSON.stringify(staticUser))
    //                     .end((err, res) => {
    //                         let token = res.body.data.token
    //                         let reviewSample = reviewFixtures.create()
    //                         chai.request(server)
    //                             .post('/api/v1/reviews')
    //                             .set('Content-Type', 'application/json')
    //                             .set('Authorization', token)
    //                             .query({ movieId: movieId })
    //                             .send(JSON.stringify(reviewSample))
    //                             .end((err, res) => {
    //                                 chai.request(server)
    //                                     .post('/api/v1/auth')
    //                                     .set('Content-Type', 'application/json')
    //                                     .send(JSON.stringify(staticUser2))
    //                                     .end((err, res) => {
    //                                         token = res.body.data.token
    //                                         reviewSample = reviewFixtures.create()
    //                                         chai.request(server)
    //                                             .post('/api/v1/reviews')
    //                                             .set('Content-Type', 'application/json')
    //                                             .set('Authorization', token)
    //                                             .query({ movieId: movieId })
    //                                             .send(JSON.stringify(reviewSample))
    //                                             .end((err, res) => {
    //                                                 let reviewId = res.body.data._id
    //                                                 chai.request(server)
    //                                                     .delete('/api/v1/reviews')
    //                                                     .set('Authorization', token)
    //                                                     .query({ reviewId: reviewId })
    //                                                     .end((err, res) => {
    //                                                         expect(res.status).to.equal(200)
    //                                                         let { success, data } = res.body
    //                                                         expect(success).to.eq(true)
    //                                                     })
    //                                             })
    //                                     })
    //                             })
    //                     })
    //             })
    //     })

    //     it('Should not delete a review because of invalid reviewId', () => {
    //         chai.request(server)
    //             .post('/api/v1/auth')
    //             .set('Content-Type', 'application/json')
    //             .send(JSON.stringify(staticUser))
    //             .end((err, res) => {
    //                 let token = res.body.data.token
    //                 chai.request(server)
    //                     .get('/api/v1/reviews')
    //                     .set('Authorization', token)
    //                     .query({ pagination: false })
    //                     .end((err, res) => {
    //                         let reviewId = 'reviewId'
    //                         chai.request(server)
    //                             .delete('/api/v1/reviews')
    //                             .set('Authorization', token)
    //                             .query({ reviewId: reviewId })
    //                             .end((err, res) => {
    //                                 expect(res.status).to.equal(422)
    //                                 let { success, data } = res.body
    //                                 expect(success).to.eq(false)
    //                             })
    //                     })
    //             })
    //     })
    // })
})
