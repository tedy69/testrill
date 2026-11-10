use glib::{prelude::*, Variant};

fn values() -> Variant {
    ["first", "", "日本語", "last"].to_variant()
}

#[test]
fn next_reads_borrowed_strings_and_stops_at_the_end() {
    let variant = values();
    let mut iter = variant.array_iter_str().unwrap();
    assert_eq!(iter.next(), Some("first"));
    assert_eq!(iter.next(), Some(""));
    assert_eq!(iter.next(), Some("日本語"));
    assert_eq!(iter.next(), Some("last"));
    assert_eq!(iter.next(), None);
    assert_eq!(iter.next(), None);
}

#[test]
fn next_back_reads_from_the_end() {
    let variant = values();
    let mut iter = variant.array_iter_str().unwrap();
    assert_eq!(iter.next_back(), Some("last"));
    assert_eq!(iter.next_back(), Some("日本語"));
    assert_eq!(iter.next_back(), Some(""));
    assert_eq!(iter.next_back(), Some("first"));
    assert_eq!(iter.next_back(), None);
}

#[test]
fn nth_skips_forward_without_losing_string_values() {
    let variant = values();
    let mut iter = variant.array_iter_str().unwrap();
    assert_eq!(iter.nth(2), Some("日本語"));
    assert_eq!(iter.next(), Some("last"));
    assert_eq!(iter.nth(usize::MAX), None);
}

#[test]
fn nth_back_skips_from_the_end() {
    let variant = values();
    let mut iter = variant.array_iter_str().unwrap();
    assert_eq!(iter.nth_back(2), Some(""));
    assert_eq!(iter.next_back(), Some("first"));
    assert_eq!(iter.nth_back(usize::MAX), None);
}

#[test]
fn last_reads_the_final_string() {
    let variant = values();
    assert_eq!(variant.array_iter_str().unwrap().last(), Some("last"));
}

#[test]
fn mixed_iteration_and_empty_arrays_remain_fused() {
    let variant = values();
    let mut iter = variant.array_iter_str().unwrap();
    assert_eq!(iter.next(), Some("first"));
    assert_eq!(iter.next_back(), Some("last"));
    assert_eq!(iter.nth(1), Some("日本語"));
    assert_eq!(iter.len(), 0);
    assert_eq!(iter.next(), None);
    assert_eq!(iter.next_back(), None);

    let empty = Vec::<String>::new().to_variant();
    assert_eq!(empty.array_iter_str().unwrap().next(), None);
    assert_eq!(empty.array_iter_str().unwrap().last(), None);
}

#[test]
fn truncating_owned_pointer_values_keeps_the_slice_allocation_usable() {
    let mut values: glib::PtrSlice<glib::Object> = (0..32)
        .map(|_| glib::Object::new::<glib::Object>())
        .collect();
    let removed = values[2].downgrade();
    let retained = values[0].downgrade();
    values.truncate(2);
    assert_eq!(values.len(), 2);
    assert!(removed.upgrade().is_none());
    assert!(retained.upgrade().is_some());
    let replacement = glib::Object::new::<glib::Object>();
    values.push(replacement.clone());
    assert_eq!(values[2], replacement);
    values.truncate(0);
    assert!(retained.upgrade().is_none());
    values.push(replacement.clone());
    assert_eq!(values[0], replacement);
}
