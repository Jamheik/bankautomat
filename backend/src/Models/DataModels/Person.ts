export default interface Person {
    UserID?: number,
    LastName: string,
    FirstName: string,
    Email: string,
    Password: string,
    CustomerID?: number,
}

type CategoryRemoveKeys =  'personID' |  'lastname' |  'firstname' |  'dateOfBirth' |  'address' |  'created_at';
export type PersonLogin = Omit<Person, CategoryRemoveKeys>;