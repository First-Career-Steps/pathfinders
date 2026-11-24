import './setup-conversion';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type Stripe from 'stripe';
import { boundStudent, enrollmentRef, matchesOffer } from '../src/lib/workshop-commerce';
import { checkWriting, hasWorkshop, WORKSHOP_KEY } from '../src/lib/workshop';

test('checkout is bound to the account that started it',()=>{
    const id = '00000000-0000-4000-8000-000000000001';
    const ref = enrollmentRef(id, 'local signing fixture');
    assert.equal(boundStudent(ref,'local signing fixture'),id);
    for (const other of [ref.replace(id,id.slice(0,-1)+'2'),ref+'_other',null,id]) {
        assert.equal(boundStudent(other,'local signing fixture'),null);
    }
});
test('only the intended $4.99 USD one-time payment link can grant access',()=>{
    const s={payment_link:'plink_example',currency:'usd',amount_subtotal:499,mode:'payment',metadata:{fcs_workshop:WORKSHOP_KEY}} as const;
    assert.ok(matchesOffer(s,'plink_example'));
    assert.ok(!matchesOffer(s,'another-link'));
    for(const properties of [{amount_subtotal:199},{mode:'subscription'},{currency:'eur'},{metadata:{}}]) {
        assert.ok(!matchesOffer({...s,...properties} as Stripe.Checkout.Session,'plink_example'));
    }
    assert.ok(hasWorkshop({[WORKSHOP_KEY]:'cs_live_fixture'}));
    assert.ok(!hasWorkshop({[WORKSHOP_KEY]:true}));
});
test('draft feedback flags unsupported numbers and changes in responsibility',()=>{
    const original={facts:'I checked in guests at 2 events.',bullet:'Led 2 events for 250 guests.',answer:'I checked people in.'};
    assert.equal(checkWriting(original).length,2);
    assert.deepEqual(checkWriting({...original,bullet:'Checked in guests at 2 events.'}),[]);
    assert.deepEqual(checkWriting({...original,bullet:'Checked in guests at 2 events.',answer:'Guests arrived.'}).length,1);
});

test('payment fulfillment is idempotent, honors refunds and isolates orders from other buyers',async()=>{
    const {reconcilePurchase,workshopLinkId} = await import('../src/lib/workshop-commerce');
    const id='00000000-0000-4000-8000-000000000001';
    const session = {id:'cs_test_fixture',payment_link:workshopLinkId(),client_reference_id:enrollmentRef(id,'fixture'),
        metadata:{fcs_workshop:WORKSHOP_KEY},payment_status:'unpaid',currency:'usd',amount_subtotal:499,mode:'payment',
        payment_intent:{latest_charge:{refunded:false}}};
    const metadata:Record<string,unknown>={};
    let writes=0;
    const services={verifyRef:(ref:string)=>boundStudent(ref,'fixture'), stripe:()=>({checkout:{sessions:{retrieve:async()=>session}}}),
        admin:()=>({auth:{admin:{getUserById:async()=>({data:{user:{app_metadata:metadata}}}),
            updateUserById:async(_id:string,data:{app_metadata:Record<string,unknown>})=>{writes++;Object.assign(metadata,data.app_metadata);return {error:null};}}}})};
    type Services=NonNullable<Parameters<typeof reconcilePurchase>[2]>;
    const reconcile=(viewer?:{id:string})=>reconcilePurchase(session.id,viewer,services as unknown as Services);
    assert.equal(await reconcile(),'pending');assert.equal(writes,0);
    session.payment_status='paid';
    assert.equal(await reconcile({id:'another-user'}),'wrong-account');assert.equal(writes,0);
    assert.equal(await reconcile(),'ready');assert.equal(await reconcile({id}),'ready');assert.equal(writes,1);
    session.payment_intent.latest_charge.refunded=true;
    assert.equal(await reconcile(),'reversed');assert.equal(hasWorkshop(metadata),false);
    assert.equal(await reconcile(),'reversed');assert.equal(writes,2);
});
