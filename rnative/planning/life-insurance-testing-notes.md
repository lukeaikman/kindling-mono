# Life INsurance Testing Notes

## 1. Insured People
When selecting who the insured party (Life Assured Drop Down), the user should be first and bold (as they are currently), that the spouse (if exists) should be second. Then there should be a divider line. Then Children should be listed, and then other dividing line. Then other contacts.

## Split by amount
We are giving the use of the opportunity to split by amount. We need to implement the same validation logic that we have for split by percentage, where the total must add up to the total insured. We should also have a wizard that mimics the functions of the split by percentage. Please analyse all of that logic and let me know the plan and whether we should be reusing it, or whether we just mimic the logic that works and implement it for a mount.

## Beneficiaries if in trust
The person who's life is assured should always be excluded from the list of potential beneficiaries that can be selected. 