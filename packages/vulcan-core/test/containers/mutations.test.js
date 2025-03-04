import React from 'react';
import {
    withCreate,
    withUpdate,
    withUpsert,
    withDelete,
    withMutation,
    useCreate,
    useUpdate,
    useUpsert,
    useDelete
} from '../../lib/modules';
import {
    multiQueryUpdater,
    buildCreateQuery,
} from '../../lib/modules/containers/create'
import {
    buildUpdateQuery
} from '../../lib/modules/containers/update'
import {
    buildUpsertQuery
} from '../../lib/modules/containers/upsert'
import {
    buildDeleteQuery
} from '../../lib/modules/containers/delete'
import { MockedProvider } from 'meteor/vulcan:test';
import { mount } from 'enzyme';
import expect from 'expect';
import gql from 'graphql-tag';
import sinon from 'sinon'

const test = it;

describe('vulcan:core/container/mutations', () => {
    const typeName = 'Foo';
    const Foo = {
        options: {
            collectionName: 'Foos',
            typeName,
            multiResolverName: 'foos'
        }
    };
    const fragmentName = 'FoosDefaultFragment';
    const fragment = {
        definitions: [{
            name: {
                value: fragmentName
            }
        }],
        toString: () => `fragment FoosDefaultFragment on Foo { 
        _id
        hello
        __typename
      }`
    };

    const rawFoo = { hello: 'world' };
    const fooUpdate = { _id: 1, hello: 'world' };
    const foo = { _id: 1, hello: 'world', __typename: 'Foo' };
    const TestComponent = () => 'test';
    const defaultOptions = {
        collection: Foo,
        fragmentName: fragmentName,
        fragment
    };
    describe('common', () => {
        test('export hooks and hocs', () => {
            expect(useCreate).toBeInstanceOf(Function)
            expect(useUpdate).toBeInstanceOf(Function)
            expect(useUpsert).toBeInstanceOf(Function)
            expect(useDelete).toBeInstanceOf(Function)
            expect(withCreate).toBeInstanceOf(Function)
            expect(withUpdate).toBeInstanceOf(Function)
            expect(withUpsert).toBeInstanceOf(Function)
            expect(withDelete).toBeInstanceOf(Function)
        })
        test('pass down props', () => {
            const CreateComponent = withCreate(defaultOptions)(TestComponent);
            const UpdateComponent = withUpdate(defaultOptions)(TestComponent);
            const UpsertComponent = withUpsert(defaultOptions)(TestComponent);
            const DeleteComponent = withDelete(defaultOptions)(TestComponent);
            [
                CreateComponent,
                UpdateComponent,
                UpsertComponent,
                DeleteComponent
            ].forEach((C) => {
                const wrapper = mount(
                    <MockedProvider mocks={[]}>
                        <C foo="bar" />
                    </MockedProvider>
                )
                expect({
                    res: wrapper.find('TestComponent').prop('foo'),
                    C: C.displayName
                }).toEqual({ res: "bar", C: C.displayName })
            })
        })
    })
    describe('withCreate', () => {
        // NOT passing for no reason...
        // @see https://github.com/apollographql/react-apollo/issues/3478
        test('run a create mutation', async () => {
            const CreateComponent = withCreate(defaultOptions)(TestComponent);
            const responses = [{
                request: {
                    query: buildCreateQuery({ fragmentName, fragment, typeName }),
                    variables: {
                        data: rawFoo
                    }
                },
                result: {
                    data: {
                        createFoo: {
                            data: foo,
                            __typename: 'Foo'
                        },
                    }
                }
            }];
            const wrapper = mount(
                <MockedProvider mocks={responses}>
                    <CreateComponent />
                </MockedProvider>
            );
            // trigger the query
            expect(wrapper.find(TestComponent).prop('createFoo')).toBeInstanceOf(Function);
            const res = await wrapper.find(TestComponent).prop('createFoo')({
                data: rawFoo
            });
            expect(res).toEqual({ data: { createFoo: { data: foo, __typename: 'Foo' } } });
        });

        describe('multiQuery update after create mutation for optimistic UI', () => {
            const defaultOptions = {
                typeName, fragment, fragmentName,
                collection: Foo,
            }
            const defaultCacheContent = {
                foos: {
                    results: [],
                    totalCount: 0
                }
            }
            const defaultCacheData = {
                data: {
                    ROOT_QUERY: {
                        // variables are contained in the query name
                        [`foos(${JSON.stringify(
                            {
                                input: {
                                    terms: {}
                                }
                            }
                        )})`]: {}
                    }
                }
            }

            beforeEach(() => {
                Foo.getParameters = (terms) => ({
                    selector: {},
                    options: {}
                }
                )
            })
            test('add document to multi query after a creation', () => {
                const update = multiQueryUpdater({ ...defaultOptions, resolverName: 'createFoo' })
                const writeQuery = sinon.spy()
                const cache = {
                    readQuery: () => defaultCacheContent,
                    writeQuery,
                    data: defaultCacheData
                }
                update(cache, {
                    data: {
                        createFoo: {
                            data: foo
                        }
                    }
                })
                expect(writeQuery.calledOnce).toBe(true)
            })
            test('update document if already there', () => {
                const update = multiQueryUpdater({ ...defaultOptions, resolverName: 'createFoo' })
                const writeQuery = sinon.spy()
                const cache = {
                    readQuery: () => ({
                        ...defaultCacheContent,
                        foos: {
                            results: [foo],
                            totalCount: 1
                        }
                    }),
                    writeQuery,
                    data: defaultCacheData
                }
                const updateFoo = { ...foo, UPDATED: true }
                update(cache, {
                    data: {
                        createFoo: {
                            data: updateFoo
                        }
                    }
                })
                expect(writeQuery.calledOnce).toBe(true)
                expect(writeQuery.getCall(0).args[0]).toMatchObject({
                    data: { 'foos': { results: [updateFoo], totalCount: 1 } }
                })
            })
            test('do not add document if it does not match the mongo selector', () => {
                const update = multiQueryUpdater({ ...defaultOptions, resolverName: 'createFoo' })
                const writeQuery = sinon.spy()
                const cache = {
                    readQuery: () => defaultCacheContent,
                    writeQuery,
                    data: defaultCacheData
                }
                const newFoo = { ...foo, val: 41 }
                Foo.getParameters = () => ({
                    selector: {
                        val: { $gt: 42 }
                    },
                    options: {}
                })
                update(cache, {
                    data: {
                        createFoo: {
                            data: newFoo
                        }
                    }
                })
                expect(writeQuery.notCalled).toBe(true)
            })
            test('add document if it does match the mongo selector', () => {
                const update = multiQueryUpdater({ ...defaultOptions, resolverName: 'createFoo' })
                const writeQuery = sinon.spy()
                const cache = {
                    readQuery: () => defaultCacheContent,
                    writeQuery,
                    data: defaultCacheData
                }
                const newFoo = { ...foo, val: 46 }
                Foo.getParameters = () => ({
                    selector: {
                        val: { $gt: 42 }
                    },
                    options: {}
                })
                update(cache, {
                    data: {
                        createFoo: {
                            data: newFoo
                        }
                    }
                })
                expect(writeQuery.calledOnce).toBe(true)
            })
            test('sort documents', () => {
                const update = multiQueryUpdater({ ...defaultOptions, resolverName: 'createFoo' })
                const writeQuery = sinon.spy()
                const cache = {
                    readQuery: () => ({
                        foos: {
                            results: [{ val: 40 }, { val: 43 }],
                            totalCount: 2
                        }
                    }),
                    writeQuery,
                    data: defaultCacheData
                }
                const newFoo = { ...foo, val: 42 }
                Foo.getParameters = () => ({
                    selector: {},
                    options: {
                        sort: {
                            val: 1
                        }
                    }
                })
                update(cache, {
                    data: {
                        createFoo: {
                            data: newFoo
                        }
                    }
                })
                const res = writeQuery.getCall(0).args[0].data.foos.results
                expect(res).toHaveLength(3)
                expect(res[1]).toEqual(newFoo)
            })
        })
    });

    describe('update', () => {
        test('run update mutation', async () => {
            const UpdateComponent = withUpdate(defaultOptions)(TestComponent)
            const responses = [{
                request: {
                    query: buildUpdateQuery({ typeName, fragmentName, fragment })
                    ,
                    variables: {
                        //selector: { documentId: foo._id },
                        data: fooUpdate
                    }
                },
                result: {
                    data: {
                        updateFoo: {
                            data: foo,
                            __typename: 'Foo'
                        }
                    }
                }
            }]
            const wrapper = mount(
                <MockedProvider mocks={responses} >
                    <UpdateComponent />
                </MockedProvider>
            )
            expect(wrapper.find(TestComponent).prop('updateFoo')).toBeInstanceOf(Function)
            const res = await wrapper.find(TestComponent).prop('updateFoo')({
                data: fooUpdate
            })
            expect(res).toEqual({ data: { updateFoo: { data: foo, __typename: 'Foo' } } })
        })
    })
    describe('upsert', () => {
        test('run upsert mutation', async () => {
            const UpsertComponent = withUpsert(defaultOptions)(TestComponent)
            const responses = [{
                request: {
                    query: buildUpsertQuery({ typeName, fragmentName, fragment }),
                    variables: {
                        data: fooUpdate
                    }
                },
                result: {
                    data: {
                        upsertFoo: {
                            data: foo,
                            __typename: 'Foo'
                        }
                    }
                }
            }]
            const wrapper = mount(
                <MockedProvider mocks={responses} >
                    <UpsertComponent />
                </MockedProvider>
            )
            expect(wrapper.find(TestComponent).prop('upsertFoo')).toBeInstanceOf(Function)
            const res = await wrapper.find(TestComponent).prop('upsertFoo')({
                data: fooUpdate
            })
            expect(res).toEqual({ data: { upsertFoo: { data: foo, __typename: 'Foo' } } })
        })
    })
    describe('delete', () => {
        test('run delete mutations', async () => {
            const DeleteComponent = withDelete(defaultOptions)(TestComponent)
            const responses = [{
                request: {
                    query: buildDeleteQuery({ typeName, fragment, fragmentName }),
                    variables: {
                        selector: {
                            documentId: "42"
                        }
                    }
                },
                result: {
                    data: {
                        deleteFoo: {
                            data: foo,
                            __typename: 'Foo'
                        }
                    }
                }
            }]
            const wrapper = mount(
                <MockedProvider mocks={responses} >
                    <DeleteComponent />
                </MockedProvider>
            )
            expect(wrapper.find(TestComponent).prop('deleteFoo')).toBeInstanceOf(Function)
            const res = await wrapper.find(TestComponent).prop('deleteFoo')({
                documentId: "42"
            })
            expect(res).toEqual({ data: { deleteFoo: { data: foo, __typename: 'Foo' } } })

        })
    })

    describe('custom mutation', () => {
        test('return a component even if fragment is not yet registered', () => {
            const MutationComponent = withMutation({ name: 'whatever', fragmentName: 'foobar' })(TestComponent)
            expect(MutationComponent).toBeInstanceOf(Function)
        })
    })

});